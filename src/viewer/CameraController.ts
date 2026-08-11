import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";
import { VIEWER_CONFIG } from "./ViewerConfig";
import type { ViewPreset } from "../core/domain/vehicle";

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private autoRotateWanted = false;
  private lastBox: THREE.Box3 | null = null;
  private currentPreset: ViewPreset = "side";

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.camera.position.set(
      VIEWER_CONFIG.HOME_CAMERA.x,
      VIEWER_CONFIG.HOME_CAMERA.y,
      VIEWER_CONFIG.HOME_CAMERA.z
    );

    this.controls = new OrbitControls(this.camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.enablePan = true;
    this.controls.minDistance = 0.3; // Allow close-up inspection into cabin/cockpit
    this.controls.maxDistance = VIEWER_CONFIG.MAX_ZOOM_DISTANCE;

    // Enable OrbitControls camera rotation for professional vehicle inspection:
    // Camera orbits around the stationary vehicle 360° horizontally and vertically.
    this.controls.enableRotate = true;
    this.controls.minPolarAngle = Math.PI * 0.05; // ~9°: look down into roof/cockpit/interior
    this.controls.maxPolarAngle = Math.PI * 0.92; // ~165°: look up at underbody/chassis without flipping
    this.controls.autoRotate = false;
    this.controls.target.set(
      VIEWER_CONFIG.HOME_TARGET.x,
      VIEWER_CONFIG.HOME_TARGET.y,
      VIEWER_CONFIG.HOME_TARGET.z
    );
    this.controls.update();
  }

  get target() {
    return this.controls.target;
  }

  update(delta: number, isSelected: boolean) {
    if (this.autoRotateWanted && !isSelected) {
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = VIEWER_CONFIG.AUTO_ROTATE_SPEED * 1.5;
    } else {
      this.controls.autoRotate = false;
    }
    return this.controls.update(delta);
  }

  setAutoRotate(enabled: boolean) {
    this.autoRotateWanted = enabled;
  }

  get isAutoRotate() {
    return this.autoRotateWanted;
  }

  zoom(deltaDirection: number, duration = 0.5) {
    const targetZ = THREE.MathUtils.clamp(
      this.camera.position.z + deltaDirection * 1.2,
      VIEWER_CONFIG.MIN_ZOOM_DISTANCE,
      VIEWER_CONFIG.MAX_ZOOM_DISTANCE
    );
    return gsap.to(this.camera.position, {
      z: targetZ,
      duration,
      ease: "power2.out",
      onUpdate: () => this.controls.update(),
    });
  }

  // Dynamic Bounding Box Camera Framing (THREE.Box3):
  frameObject(box: THREE.Box3, aspect: number, preset: ViewPreset = this.currentPreset, duration = 0.85) {
    this.lastBox = box;
    this.currentPreset = preset;

    // Handle empty or invalid bounding box
    const size = box.isEmpty() ? new THREE.Vector3(4.2, 1.4, 1.8) : box.getSize(new THREE.Vector3());
    const center = box.isEmpty() ? new THREE.Vector3(0, 0, 0) : box.getCenter(new THREE.Vector3());

    // Ensure safe positive dimensions
    const safeSizeY = Math.max(size.y, 0.8);
    const safeSizeX = Math.max(size.x, 1.5);

    const fovRad = THREE.MathUtils.degToRad(this.camera.fov);

    let frustumH = safeSizeY / 0.30;
    let frustumW = frustumH * aspect;

    if (frustumW < safeSizeX / 0.42) {
      frustumW = safeSizeX / 0.42;
      frustumH = frustumW / aspect;
    }

    // Frame vehicle comfortably zoomed out with ~20-25% whitespace around all four sides
    const calculatedDist = frustumH / (2 * Math.tan(fovRad / 2));
    const dist = THREE.MathUtils.clamp(calculatedDist, 3.5, 14.0);
    const eyeY = center.y + 0.15;

    let targetCam = { x: center.x, y: eyeY, z: center.z + dist };
    let targetCenter = { x: center.x, y: eyeY, z: center.z };

    switch (preset) {
      case "side":
        targetCam = { x: center.x, y: eyeY, z: center.z + dist };
        targetCenter = { x: center.x, y: eyeY, z: center.z };
        break;
      case "front":
        targetCam = { x: center.x - dist, y: eyeY, z: center.z };
        targetCenter = { x: center.x, y: eyeY, z: center.z };
        break;
      case "top":
        targetCam = { x: center.x, y: eyeY + dist * 1.1, z: center.z + 0.01 };
        targetCenter = { x: center.x, y: eyeY, z: center.z };
        break;
      case "isometric":
        targetCam = { x: center.x - dist * 0.7, y: eyeY + dist * 0.35, z: center.z + dist * 0.7 };
        targetCenter = { x: center.x, y: eyeY, z: center.z };
        break;
      case "engine":
        targetCam = { x: center.x - 0.7, y: eyeY + 0.5, z: center.z + 1.2 };
        targetCenter = { x: center.x - 0.8, y: eyeY, z: center.z };
        break;
      case "interior":
        targetCam = { x: center.x + 0.2, y: eyeY + 0.4, z: center.z + 0.6 };
        targetCenter = { x: center.x, y: eyeY + 0.3, z: center.z };
        break;
      case "wheels":
        targetCam = { x: center.x - 1.0, y: eyeY - 0.1, z: center.z + 1.6 };
        targetCenter = { x: center.x - 1.35, y: eyeY - 0.1, z: center.z };
        break;
    }

    this.camera.position.set(targetCam.x, targetCam.y, targetCam.z);
    this.controls.target.set(targetCenter.x, targetCenter.y, targetCenter.z);
    this.controls.update();

    if (duration === 0) {
      return;
    }

    const tl = gsap.timeline();
    tl.to(this.camera.position, {
      ...targetCam,
      duration,
      ease: "power3.inOut",
      onUpdate: () => this.controls.update(),
    }, 0);
    tl.to(this.controls.target, {
      ...targetCenter,
      duration,
      ease: "power3.inOut",
      onUpdate: () => this.controls.update(),
    }, 0);
    return tl;
  }

  setPresetView(preset: ViewPreset, duration = 0.9) {
    if (this.lastBox) {
      return this.frameObject(this.lastBox, this.camera.aspect, preset, duration);
    }
  }

  reset(duration = 0.8) {
    if (this.lastBox) {
      return this.frameObject(this.lastBox, this.camera.aspect, "side", duration);
    }
  }

  dispose() {
    this.controls.dispose();
  }
}
