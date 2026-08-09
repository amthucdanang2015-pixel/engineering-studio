import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VIEWER_CONFIG } from "./ViewerConfig";
import { disposeObject } from "../core/runtime/dispose";

export interface LoadedVehicleAsset {
  url: string;
  pivot: THREE.Group;
  meshes: THREE.Mesh[];
  meshMap: Map<string, THREE.Mesh>;
  mixer: THREE.AnimationMixer | null;
}

export class AssetManager {
  private loader: GLTFLoader;
  private cache = new Map<string, LoadedVehicleAsset>();
  private inflight = new Map<string, Promise<LoadedVehicleAsset>>();
  private current: LoadedVehicleAsset | null = null;
  private maxAnisotropy: number;

  constructor(renderer: THREE.WebGLRenderer) {
    this.maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    this.loader = new GLTFLoader();
  }

  get currentAsset() {
    return this.current;
  }

  prefetch(url: string) {
    if (this.cache.has(url) || this.inflight.has(url)) return;
    void fetch(url, { priority: "low" } as RequestInit).catch(() => {});
  }

  async load(url: string, onProgress?: (progress: number) => void): Promise<LoadedVehicleAsset> {
    const cached = this.cache.get(url);
    if (cached) {
      this.cache.delete(url);
      this.cache.set(url, cached);
      onProgress?.(1);
      this.current = cached;
      return cached;
    }

    const pending = this.inflight.get(url) ?? this.parse(url, onProgress);
    this.inflight.set(url, pending);
    try {
      const asset = await pending;
      this.cache.set(url, asset);
      this.current = asset;
      return asset;
    } finally {
      this.inflight.delete(url);
    }
  }

  private async parse(url: string, onProgress?: (progress: number) => void): Promise<LoadedVehicleAsset> {
    const gltf = await this.loader.loadAsync(url, (event) => {
      if (event.total > 0) onProgress?.(event.loaded / event.total);
    });

    const model = gltf.scene;

    // Verified GLB Coordinate System: Model is natively Y-UP!
    // +Y = vehicle UP (Roof = +1.86m)
    // -Y = vehicle DOWN (Wheels bottom = +0.20m)
    // -X = vehicle FRONT (Front Bumper = -2.42m)
    // +X = vehicle REAR (Rear Deck = +1.35m)
    // +Z = vehicle LEFT / DRIVER SIDE (+1.00m)
    // Model rotation is kept untransformed at (0, 0, 0)
    model.rotation.set(0, 0, 0);
    model.updateMatrixWorld(true);

    // Calculate bounding box in canonical upright orientation
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const scale = VIEWER_CONFIG.FIT_SIZE / maxDim;

    model.scale.setScalar(scale);
    model.updateMatrixWorld(true);

    // Recompute box after scaling to position wheels precisely on Y = 0
    const scaledBox = new THREE.Box3().setFromObject(model);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

    model.position.x = -scaledCenter.x;
    model.position.z = -scaledCenter.z;
    model.position.y = -scaledBox.min.y; // Lowest point of wheels sits at Y = 0

    const pivot = new THREE.Group();
    pivot.name = "vehicle-pivot";
    pivot.add(model);

    const meshes: THREE.Mesh[] = [];
    const meshMap = new Map<string, THREE.Mesh>();

    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      // Clone material so every mesh node has a unique, independent material instance
      if (Array.isArray(child.material)) {
        child.material = child.material.map((mat) => mat.clone());
      } else if (child.material) {
        child.material = child.material.clone();
      }

      meshes.push(child);
      if (child.name) {
        meshMap.set(child.name, child);
      }

      child.frustumCulled = false;
      child.castShadow = false;
      child.receiveShadow = false;

      this.forEachMaterial(child, (material) => {
        material.depthTest = true;
        material.depthWrite = true;

        if (material instanceof THREE.MeshStandardMaterial) {
          material.roughness = THREE.MathUtils.clamp(material.roughness ?? 0.5, 0.1, 0.9);
          material.envMapIntensity = 0.85;

          if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
          if (material.normalMap) material.normalScale.multiplyScalar(0.75);

          for (const map of [
            material.map,
            material.normalMap,
            material.roughnessMap,
            material.metalnessMap,
            material.aoMap,
            material.emissiveMap,
          ]) {
            if (!map) continue;
            map.anisotropy = this.maxAnisotropy;
            map.generateMipmaps = true;
            map.minFilter = THREE.LinearMipmapLinearFilter;
            map.magFilter = THREE.LinearFilter;
            map.needsUpdate = true;
          }
        }
        material.needsUpdate = true;
      });
    });

    let mixer: THREE.AnimationMixer | null = null;
    if (gltf.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => mixer?.clipAction(clip).play());
    }

    return { url, pivot, meshes, meshMap, mixer };
  }

  forEachMaterial(mesh: THREE.Mesh, fn: (material: THREE.Material) => void) {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach(fn);
  }

  updateMaterial(meshName: string, config: { color?: string; roughness?: number; metalness?: number; opacity?: number; wireframe?: boolean }) {
    if (!this.current) return;
    const mesh = this.current.meshMap.get(meshName);
    if (!mesh) return;

    // Update ONLY the material on the specific mesh instance selected
    this.forEachMaterial(mesh, (material) => {
      if (material instanceof THREE.MeshStandardMaterial) {
        if (config.color !== undefined) material.color.set(config.color);
        if (config.roughness !== undefined) material.roughness = config.roughness;
        if (config.metalness !== undefined) material.metalness = config.metalness;
        if (config.opacity !== undefined) {
          material.opacity = config.opacity;
          material.transparent = config.opacity < 1;
        }
        if (config.wireframe !== undefined) material.wireframe = config.wireframe;
        material.needsUpdate = true;
      }
    });
  }

  release(asset: LoadedVehicleAsset | null = this.current) {
    if (!asset) return;
    asset.mixer?.stopAllAction();
    asset.pivot.removeFromParent();
    if (asset === this.current) this.current = null;
  }

  dispose() {
    this.release();
    this.cache.forEach((asset) => {
      asset.mixer?.stopAllAction();
      asset.pivot.removeFromParent();
      disposeObject(asset.pivot);
    });
    this.cache.clear();
  }
}
