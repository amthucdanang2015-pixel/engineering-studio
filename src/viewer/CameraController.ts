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
    this.controls.minDistance = VIEWER_CONFIG.MIN_ZOOM_DISTANCE;
    this.controls.maxDistance = VIEWER_CONFIG.MAX_ZOOM_DISTANCE;

    // Disable OrbitControls camera rotation during pointer drag
    // Vehicle rotation is applied ONLY to VehicleRoot.rotation.y, keeping Platform & EnvironmentRoot 100% fixed!
    this.controls.enableRotate = false;
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
    this.controls.autoRotate = false;
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
  // TEMPORARY DIAGNOSTIC TEST: Multiply camera distance by 2.0x to prove distance control
  frameObject(box: THREE.Box3, aspect: number, preset: ViewPreset = this.currentPreset, duration = 0.85) {
    this.lastBox = box;
    this.currentPreset = preset;

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const fovRad = THREE.MathUtils.degToRad(this.camera.fov);

    let frustumH = size.y / 0.2;
    let frustumW = frustumH * aspect;

    if (frustumW < size.x / 0.70) {
      frustumW = size.x / 0.70;
      frustumH = frustumW / aspect;
    }

    // Frame vehicle to fill ~65% of viewport height
    const calculatedDist = frustumH / (2 * Math.tan(fovRad / 2));
    const dist = calculatedDist;

    let targetCam = { x: center.x, y: center.y, z: center.z + dist };
    let targetCenter = { x: center.x, y: center.y, z: center.z };

    switch (preset) {
      case "side":
        targetCam = { x: center.x, y: center.y, z: center.z + dist };
        targetCenter = { x: center.x, y: center.y, z: center.z };
        break;
      case "front":
        targetCam = { x: center.x - dist, y: center.y, z: center.z };
        targetCenter = { x: center.x, y: center.y, z: center.z };
        break;
      case "top":
        targetCam = { x: center.x, y: center.y + dist * 1.2, z: center.z + 0.01 };
        targetCenter = { x: center.x, y: center.y, z: center.z };
        break;
      case "isometric":
        targetCam = { x: center.x - dist * 0.7, y: center.y + dist * 0.25, z: center.z + dist * 0.7 };
        targetCenter = { x: center.x, y: center.y, z: center.z };
        break;
      case "engine":
        targetCam = { x: center.x - 0.7, y: center.y + 0.9, z: center.z + 1.4 };
        targetCenter = { x: center.x - 0.8, y: center.y + 0.3, z: center.z };
        break;
      case "interior":
        targetCam = { x: center.x + 0.2, y: center.y + 0.6, z: center.z + 0.7 };
        targetCenter = { x: center.x, y: center.y + 0.5, z: center.z };
        break;
      case "wheels":
        targetCam = { x: center.x - 1.0, y: center.y + 0.15, z: center.z + 1.9 };
        targetCenter = { x: center.x - 1.35, y: center.y + 0.15, z: center.z };
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
