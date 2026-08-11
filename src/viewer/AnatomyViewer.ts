import * as THREE from "three";
import gsap from "gsap";
import { VIEWER_CONFIG, type ViewerCallbacks, type ViewerOptions } from "./ViewerConfig";
import { AssetManager, type LoadedVehicleAsset } from "./AssetManager";
import { CameraController } from "./CameraController";
import { LightingManager } from "./Lighting";
import { InteractionManager } from "./InteractionManager";
import type { ViewPreset } from "../core/domain/vehicle";

export class AnatomyViewer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(VIEWER_CONFIG.CAMERA_FOV, 1, 0.1, 100);

  // Scene Graph Hierarchy:
  // Scene
  // ├── EnvironmentRoot (Platform, Ground, Lights - FIXED, NEVER scales, translates, or rotates)
  // └── VehiclePresentationRoot (Handles vehicle-only presentation scale zoom & vertical platform placement)
  //     └── VehicleRoot (Handles vehicle-only YAW Y rotation ONLY - rotation.x & rotation.z LOCKED to 0)
  //         └── GLB Model (Upright canonical side profile)
  private vehiclePresentationRoot = new THREE.Group();
  private vehicleRoot = new THREE.Group();

  private vehicleZoomScale = 1.0;

  private cameraController: CameraController;
  private lightingManager: LightingManager;
  private interactionManager = new InteractionManager();
  private assets: AssetManager;

  private container: HTMLElement;
  private callbacks: ViewerCallbacks;

  private currentAsset: LoadedVehicleAsset | null = null;

  private frame = 0;
  private lastTime = performance.now();
  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver;

  private clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
  private crossSection = false;
  private isolated = false;

  private width = 1;
  private height = 1;
  private isVisible = true;
  private isPageVisible = true;

  // Render-on-demand dirty flag bookkeeping
  private dirty = true;
  private busyUntil = performance.now() + 5000;
  private loadRequest = 0;

  private selectedMeshName: string | null = null;
  private hoveredMeshName: string | null = null;
  private hoverProbe: { x: number; y: number } | null = null;
  private pointerId: number | null = null;
  private pointerStart = { x: 0, y: 0 };
  private lastPointerX = 0;
  private dragged = false;

  private calloutEl: HTMLElement | null = null;
  private disposed = false;

  // Emissive + opacity backup map per specific Mesh
  private originalEmissives = new Map<THREE.Mesh, { emissive: THREE.Color; intensity: number; opacity: number; transparent: boolean }>();

  private mode: "preview" | "build" = "build";

  constructor(container: HTMLElement, options: ViewerOptions) {
    this.container = container;
    this.callbacks = options;
    this.mode = options.mode ?? "build";

    const lowPower = window.matchMedia("(max-width: 780px)").matches || (navigator.hardwareConcurrency ?? 8) < 6;
    const pixelRatio = Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !lowPower,
      alpha: true,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
    });
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = false;
    this.renderer.localClippingEnabled = true;

    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.display = "block";

    this.renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D vehicle viewer. Drag to rotate, scroll to zoom, and click components to inspect."
    );
    this.renderer.domElement.tabIndex = 0;
    container.appendChild(this.renderer.domElement);

    // Setup Scene Hierarchy:
    // 1. EnvironmentRoot (Platform & Lighting - FIXED, NEVER rotates or scales)
    this.lightingManager = new LightingManager();
    this.lightingManager.setupEnvironment(this.scene, this.renderer);

    // 2. VehiclePresentationRoot & VehicleRoot (Vehicle Zoom & Yaw Rotation ONLY)
    this.vehiclePresentationRoot.name = "VehiclePresentationRoot";
    this.vehicleRoot.name = "VehicleRoot";

    // Position VehiclePresentationRoot so vehicle wheels sit ON TOP of platform surface
    const platformTopY = VIEWER_CONFIG.PLINTH_Y + 0.17;
    this.vehiclePresentationRoot.position.set(0, platformTopY, 0);

    this.vehiclePresentationRoot.add(this.vehicleRoot);
    this.scene.add(this.vehiclePresentationRoot);

    this.cameraController = new CameraController(this.camera, this.renderer.domElement);
    this.assets = new AssetManager(this.renderer);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);

    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        this.isVisible = entry.isIntersecting;
        if (this.isVisible) this.dirty = true;
      },
      { rootMargin: "120px" }
    );
    this.intersectionObserver.observe(container);

    document.addEventListener("visibilitychange", this.onVisibilityChange);

    const canvas = this.renderer.domElement;
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointerleave", this.onPointerLeave);
    canvas.addEventListener("keydown", this.onKeyDown);

    this.resize();
    this.animate();
  }

  prefetch(url: string) {
    this.assets.prefetch(url);
  }

  getLoadedMeshNames(): string[] {
    return this.currentAsset ? this.currentAsset.meshes.map((m) => m.name).filter(Boolean) : [];
  }

  async setVehicleModel(modelUrl: string) {
    const request = ++this.loadRequest;
    this.selectMesh(null);
    this.callbacks.onLoading?.(true, 0);

    const outgoing = this.currentAsset;
    if (outgoing) {
      this.busy(0.4);
      await gsap.to(outgoing.pivot.scale, {
        x: 0.72,
        y: 0.72,
        z: 0.72,
        duration: 0.35,
        ease: "power2.in",
        onUpdate: () => (this.dirty = true),
      });
      this.assets.release(outgoing);
      this.currentAsset = null;
      this.dirty = true;
    }

    let asset: LoadedVehicleAsset;
    try {
      asset = await this.assets.load(modelUrl, (progress) => {
        if (request === this.loadRequest) this.callbacks.onLoading?.(true, progress);
      });
    } catch (error) {
      if (request === this.loadRequest) this.callbacks.onLoading?.(false, 0);
      throw error;
    }
    if (request !== this.loadRequest || this.disposed) return;

    this.currentAsset = asset;
    asset.pivot.scale.setScalar(1);
    asset.pivot.position.set(0, 0, 0);

    // Parent GLB scene asset into VehicleRoot
    // ONLY VehicleRoot rotates around world Y axis (Yaw)! Pitch & Roll locked to 0!
    this.vehicleRoot.add(asset.pivot);
    this.vehicleRoot.rotation.set(0, 0, 0);

    // Force update matrix world before computing Bounding Box
    this.scene.updateMatrixWorld(true);

    if (this.crossSection) this.applyClipping(true);

    // Calculate actual world-space bounding box of the vehicle for dynamic camera framing
    const box = new THREE.Box3().setFromObject(this.vehicleRoot);
    this.cameraController.frameObject(box, this.camera.aspect, "side", 0.85);

    this.busy(2.5);
    this.callbacks.onLoading?.(false, 1);
  }

  // ---------------------------------------------------------------- render loop

  private animate = () => {
    this.frame = requestAnimationFrame(this.animate);
    if (!this.isVisible || !this.isPageVisible) return;

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    if (this.cameraController.update(delta, Boolean(this.selectedMeshName))) {
      this.dirty = true;
    }

    // Automatically hide solid plinth geometry when camera orbits below platform level for underbody inspection
    this.lightingManager.updateCameraVisibility(this.camera.position.y, this.cameraController.target.y);

    if (this.assets.currentAsset?.mixer) {
      this.assets.currentAsset.mixer.update(delta);
      this.dirty = true;
    }

    if (this.hoverProbe) this.resolveHover();
    if (!this.dirty && now >= this.busyUntil) return;

    if (now < this.busyUntil) this.dirty = true;

    this.positionCallout();
    this.renderer.render(this.scene, this.camera);
  };

  private busy(seconds: number) {
    this.busyUntil = Math.max(this.busyUntil, performance.now() + seconds * 1000);
    this.dirty = true;
  }

  private onVisibilityChange = () => {
    this.isPageVisible = !document.hidden;
    if (this.isPageVisible) {
      this.lastTime = performance.now();
      this.dirty = true;
    }
  };

  private resize() {
    this.width = Math.max(this.container.clientWidth, 1);
    this.height = Math.max(this.container.clientHeight, 1);
    const aspect = this.width / this.height;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    const lowPower = window.matchMedia("(max-width: 780px)").matches || (navigator.hardwareConcurrency ?? 8) < 6;
    const pixelRatio = Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(this.width, this.height, false);

    if (this.currentAsset) {
      this.scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(this.vehicleRoot);
      this.cameraController.frameObject(box, aspect, "side", 0);
    }

    this.dirty = true;
  }

  // ---------------------------------------------------------------- input & interaction

  private onPointerDown = (event: PointerEvent) => {
    this.pointerId = event.pointerId;
    this.pointerStart = { x: event.clientX, y: event.clientY };
    this.lastPointerX = event.clientX;
    this.dragged = false;
  };

  /**
   * Compute canvas-local coordinates from a PointerEvent using getBoundingClientRect.
   * This is reliable regardless of CSS scaling, devicePixelRatio, or DOM nesting.
   */
  private getCanvasOffset(event: PointerEvent): { x: number; y: number } {
    const rect = this.renderer.domElement.getBoundingClientRect();
    // Scale from CSS pixels to the internal canvas resolution
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  private onPointerMove = (event: PointerEvent) => {
    if (this.pointerId !== null) {
      if (Math.hypot(event.clientX - this.pointerStart.x, event.clientY - this.pointerStart.y) > 5) {
        this.dragged = true;
      }
      this.dirty = true;
      return;
    }
    // Use getBoundingClientRect offset for correct hover raycasting
    const offset = this.getCanvasOffset(event);
    this.hoverProbe = { x: offset.x, y: offset.y };
    this.dirty = true;
  };

  private onPointerUp = (event: PointerEvent) => {
    const wasDragging = this.dragged;
    this.pointerId = null;
    this.dragged = false;
    if (wasDragging || !this.currentAsset) return;

    if (this.mode === "preview") return;

    // Use getBoundingClientRect for correct canvas-relative coordinates
    const offset = this.getCanvasOffset(event);

    // Pick specific mesh inside VehicleRoot using recursive raycasting
    const hit = this.interactionManager.pickMesh(
      offset.x,
      offset.y,
      this.camera,
      this.width,
      this.height,
      this.vehicleRoot
    );

    this.selectMesh(hit ? hit.meshName : null);
  };

  private onPointerLeave = () => {
    this.pointerId = null;
    this.hoverProbe = null;
    if (this.hoveredMeshName) {
      this.hoveredMeshName = null;
      this.callbacks.onHover?.(null, null);
      this.applyMeshHighlights();
      this.dirty = true;
    }
  };

  private resolveHover() {
    const probe = this.hoverProbe;
    this.hoverProbe = null;
    if (!probe || !this.currentAsset) return;

    if (this.mode === "preview") {
      this.renderer.domElement.style.cursor = "";
      return;
    }

    const hit = this.interactionManager.pickMesh(
      probe.x,
      probe.y,
      this.camera,
      this.width,
      this.height,
      this.vehicleRoot
    );

    const meshName = hit?.meshName ?? null;
    if (meshName === this.hoveredMeshName) return;

    this.hoveredMeshName = meshName;
    this.renderer.domElement.style.cursor = meshName ? "pointer" : "";
    this.callbacks.onHover?.(meshName, meshName);
    this.applyMeshHighlights();
    this.dirty = true;
  }

  private applyMeshHighlights() {
    if (!this.currentAsset || this.mode === "preview") return;

    // Subtle warm-white glow on selected part; orange tint on hover.
    // All other meshes remain exactly at their original material state.
    const selectedGlow = new THREE.Color(0xffffff); // neutral white emissive for selected
    const hoverGlow = new THREE.Color(0xf5a623);    // warm amber for hover

    this.currentAsset.meshes.forEach((mesh) => {
      const isSelected = mesh.name === this.selectedMeshName;
      const isHovered = !isSelected && mesh.name === this.hoveredMeshName;

      this.assets.forEachMaterial(mesh, (material) => {
        if (material instanceof THREE.MeshStandardMaterial) {
          // Capture original emissive state once, before we ever touch it
          if (!this.originalEmissives.has(mesh)) {
            this.originalEmissives.set(mesh, {
              emissive: material.emissive.clone(),
              intensity: material.emissiveIntensity ?? 0,
              opacity: material.opacity,
              transparent: material.transparent,
            });
          }

          const orig = this.originalEmissives.get(mesh)!;

          if (isSelected) {
            // Subtle emissive brighten on selected mesh only — nothing else changes
            material.emissive.copy(selectedGlow);
            material.emissiveIntensity = 0.45;
          } else if (isHovered) {
            // Soft amber glow on hovered mesh
            material.emissive.copy(hoverGlow);
            material.emissiveIntensity = 0.25;
          } else {
            // Restore to original emissive state — no opacity or transparency changes
            material.emissive.copy(orig.emissive);
            material.emissiveIntensity = orig.intensity;
          }

          material.needsUpdate = true;
        }
      });
    });
  }

  selectMesh(meshName: string | null) {
    if (this.mode === "preview") return;
    if (this.selectedMeshName === meshName) return;
    this.selectedMeshName = meshName;
    // Stop auto-rotate when something is selected so the user can inspect it
    this.cameraController.setAutoRotate(!meshName);
    this.busy(0.4);
    this.applyMeshHighlights();
    this.callbacks.onSelect?.(meshName, meshName);
    this.dirty = true;
  }


  attachCallout(element: HTMLElement | null) {
    this.calloutEl = element;
    this.positionCallout();
    this.dirty = true;
  }

  private positionCallout() {
    if (!this.calloutEl || !this.selectedMeshName || !this.currentAsset || this.mode === "preview") return;
    const mesh = this.currentAsset.meshMap.get(this.selectedMeshName);
    if (!mesh) return;

    const pos = this.interactionManager.getScreenPosition(mesh, this.camera, this.width, this.height);
    this.calloutEl.style.transform = `translate3d(${Math.round(pos.x)}px, ${Math.round(pos.y)}px, 0)`;
    this.calloutEl.dataset.side = pos.x > this.width * 0.55 ? "left" : "right";
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") this.vehicleRoot.rotation.y -= 0.08;
    if (event.key === "ArrowRight") this.vehicleRoot.rotation.y += 0.08;
    if (event.key === "+") this.zoom(-1);
    if (event.key === "-") this.zoom(1);
    if (event.key === "Escape") this.selectMesh(null);
    this.dirty = true;
  };

  // ---------------------------------------------------------------- tools

  setAutoRotate(enabled: boolean) {
    this.cameraController.setAutoRotate(enabled);
    this.dirty = true;
  }

  setPresetView(preset: ViewPreset) {
    this.busy(0.95);
    return this.cameraController.setPresetView(preset);
  }

  focusSelected() {
    if (!this.selectedMeshName || !this.currentAsset) return;
    const mesh = this.currentAsset.meshMap.get(this.selectedMeshName);
    if (!mesh) return;

    const pos = new THREE.Vector3();
    mesh.getWorldPosition(pos);

    const tl = gsap.timeline();
    tl.to(this.cameraController.target, { x: pos.x, y: pos.y, z: pos.z, duration: 0.7, ease: "power3.inOut" }, 0);
    this.busy(0.8);
  }

  resetView() {
    this.selectMesh(null);
    this.busy(0.85);
    this.vehicleZoomScale = 1.0;
    gsap.to(this.vehiclePresentationRoot.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: "power3.out" });
    gsap.to(this.vehicleRoot.rotation, { x: 0, y: 0, z: 0, duration: 0.8, ease: "power3.out" });
    this.cameraController.reset();
  }

  zoom(direction: 1 | -1) {
    this.vehicleZoomScale = THREE.MathUtils.clamp(
      this.vehicleZoomScale + direction * -0.15,
      0.75,
      1.5
    );
    gsap.to(this.vehiclePresentationRoot.scale, {
      x: this.vehicleZoomScale,
      y: this.vehicleZoomScale,
      z: this.vehicleZoomScale,
      duration: 0.5,
      ease: "power2.out",
      onUpdate: () => (this.dirty = true),
    });
    this.busy(0.55);
  }

  toggleIsolate() {
    if (!this.currentAsset) return false;
    this.isolated = !this.isolated;
    const targetMesh = this.selectedMeshName ? this.currentAsset.meshMap.get(this.selectedMeshName) : null;

    this.currentAsset.meshes.forEach((mesh) => {
      const isTarget = mesh === targetMesh;
      const opacity = this.isolated ? (isTarget ? 1 : 0.15) : 1;

      this.assets.forEachMaterial(mesh, (material) => {
        material.transparent = this.isolated && !isTarget;
        gsap.to(material, { opacity, duration: 0.45, onUpdate: () => (this.dirty = true) });
      });
    });

    return this.isolated;
  }

  toggleCrossSection() {
    this.crossSection = !this.crossSection;
    this.applyClipping(this.crossSection);

    gsap.fromTo(
      this.clipPlane,
      { constant: -2.2 },
      {
        constant: this.crossSection ? 0 : -2.2,
        duration: 0.85,
        ease: "power2.inOut",
        onUpdate: () => (this.dirty = true),
      }
    );

    this.busy(0.95);
    return this.crossSection;
  }

  private applyClipping(enabled: boolean) {
    if (!this.currentAsset) return;
    const planes = enabled ? [this.clipPlane] : null;

    this.currentAsset.meshes.forEach((mesh) => {
      this.assets.forEachMaterial(mesh, (material) => {
        material.clippingPlanes = planes;
        material.needsUpdate = true;
      });
    });
    this.dirty = true;
  }

  toggleWireframe() {
    if (!this.currentAsset) return false;
    let enabled = false;
    this.currentAsset.meshes.forEach((mesh) => {
      this.assets.forEachMaterial(mesh, (material) => {
        if (material instanceof THREE.MeshStandardMaterial) {
          material.wireframe = !material.wireframe;
          enabled = material.wireframe;
        }
      });
    });
    this.dirty = true;
    return enabled;
  }

  updateMaterial(meshName: string, config: { color?: string; roughness?: number; metalness?: number; opacity?: number; wireframe?: boolean }) {
    this.assets.updateMaterial(meshName, config);
    this.dirty = true;
  }

  dispose() {
    this.disposed = true;
    this.loadRequest += 1;
    cancelAnimationFrame(this.frame);

    this.cameraController.dispose();
    this.lightingManager.dispose();
    this.assets.dispose();

    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibilityChange);

    const canvas = this.renderer.domElement;
    canvas.removeEventListener("pointerdown", this.onPointerDown);
    canvas.removeEventListener("pointermove", this.onPointerMove);
    canvas.removeEventListener("pointerup", this.onPointerUp);
    canvas.removeEventListener("pointerleave", this.onPointerLeave);
    canvas.removeEventListener("keydown", this.onKeyDown);

    this.renderer.dispose();
    canvas.remove();
  }
}
