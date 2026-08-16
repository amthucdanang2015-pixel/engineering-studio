"use client";

import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { AssetManager } from "@/viewer/AssetManager";
import { GlbAnalyzer } from "@/viewer/GlbAnalyzer";
import type { VehicleCatalogItem } from "@/core/domain/vehicleCatalog";
import type { SavedVehicleBuild } from "@/core/state/savedBuilds";
import type { VehicleTelemetryData } from "../utils/telemetryCalculator";
import {
  GLASS_TINT_OPACITY,
  TRIM_FINISH_PBR,
  HEADLIGHT_STYLE_PBR,
} from "@/core/domain/vehicleCustomization";

export type SimulationStage =
  | "LOADING"
  | "READY"
  | "LAUNCH"
  | "ACCELERATING"
  | "TARGET_SPEED"
  | "DECELERATING"
  | "HERO";

export interface LiveTelemetry {
  speedKmH: number;
  rpm: number;
  gear: number;
  gForce: number;
  elapsedTime: number; // in seconds
  distanceMeters: number;
  stage: SimulationStage;
  zeroTo100TimeReached: number | null; // e.g. 2.8
}

interface VehicleTestSimulatorProps {
  vehicle: VehicleCatalogItem;
  build?: SavedVehicleBuild | null;
  telemetryData: VehicleTelemetryData;
  onTelemetryUpdate?: (data: LiveTelemetry) => void;
  onStageChange?: (stage: SimulationStage) => void;
  onLoadingProgress?: (isLoading: boolean, progress: number) => void;
  replayTrigger: number;
}

interface WheelMotionBlurItem {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  isRightSide: boolean;
}

/**
 * Builds a studio PMREM reflection environment map for sharp PBR paint & rim reflections.
 */
function buildStudioEnvironmentMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const width = 64;
  const height = 128;
  const data = new Uint8Array(width * height * 4);

  const topColor = new THREE.Color(0xffffff);
  const midColor = new THREE.Color(0xe2edf8);
  const bottomColor = new THREE.Color(0xc6d6e6);
  const mixed = new THREE.Color();

  for (let y = 0; y < height; y++) {
    const factor = y / (height - 1);
    if (factor < 0.5) {
      mixed.copy(bottomColor).lerp(midColor, factor * 2);
    } else {
      mixed.copy(midColor).lerp(topColor, (factor - 0.5) * 2);
    }

    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i] = Math.round(mixed.r * 255);
      data[i + 1] = Math.round(mixed.g * 255);
      data[i + 2] = Math.round(mixed.b * 255);
      data[i + 3] = 255;
    }
  }

  const source = new THREE.DataTexture(data, width, height);
  source.mapping = THREE.EquirectangularReflectionMapping;
  source.colorSpace = THREE.SRGBColorSpace;
  source.needsUpdate = true;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envTexture = pmrem.fromEquirectangular(source).texture;
  pmrem.dispose();
  source.dispose();

  return envTexture;
}

/**
 * Creates high-speed radial wheel spoke blur texture for realistic rotational motion.
 */
function createWheelSpinTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const center = size / 2;
  const radius = size * 0.44;

  ctx.clearRect(0, 0, size, size);

  // Outer dark tire blur ring
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.lineWidth = 16;
  ctx.strokeStyle = "rgba(15, 18, 22, 0.55)";
  ctx.stroke();

  // Spoke rotational blur streaks
  const spokeCount = 12;
  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2;
    const grad = ctx.createRadialGradient(center, center, radius * 0.18, center, center, radius * 0.88);
    grad.addColorStop(0, "rgba(240, 245, 255, 0.75)");
    grad.addColorStop(0.65, "rgba(180, 195, 215, 0.4)");
    grad.addColorStop(1, "rgba(40, 45, 55, 0.0)");

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius * 0.88, angle, angle + (Math.PI * 2) / (spokeCount * 1.4));
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Inner hub metallic center
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(220, 230, 245, 0.85)";
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const VehicleTestSimulator: React.FC<VehicleTestSimulatorProps> = ({
  vehicle,
  build,
  telemetryData,
  onTelemetryUpdate,
  onStageChange,
  onLoadingProgress,
  replayTrigger,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Callback refs
  const onTelemetryUpdateRef = useRef(onTelemetryUpdate);
  onTelemetryUpdateRef.current = onTelemetryUpdate;

  const onStageChangeRef = useRef(onStageChange);
  onStageChangeRef.current = onStageChange;

  const onLoadingProgressRef = useRef(onLoadingProgress);
  onLoadingProgressRef.current = onLoadingProgress;

  const telemetryDataRef = useRef(telemetryData);
  telemetryDataRef.current = telemetryData;

  const vehicleRef = useRef(vehicle);
  vehicleRef.current = vehicle;

  const buildRef = useRef(build);
  buildRef.current = build;

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const assetManagerRef = useRef<AssetManager | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const wheelMotionDiscsRef = useRef<WheelMotionBlurItem[]>([]);
  const envTextureRef = useRef<THREE.Texture | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const loadCounterRef = useRef(0);

  // Simulation timeline & state
  const stageRef = useRef<SimulationStage>("LOADING");
  const simTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const carPosRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const currentSpeedRef = useRef<number>(0); // in km/h
  const zeroTo100AchievedRef = useRef<number | null>(null);
  const isRunningRef = useRef<boolean>(false);

  // Helper to safely transition stage
  const setStage = useCallback((newStage: SimulationStage) => {
    if (stageRef.current === newStage) return;
    stageRef.current = newStage;
    onStageChangeRef.current?.(newStage);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. START / RESTART SIMULATION TIMELINE
  // ─────────────────────────────────────────────────────────────────────────────
  const startSimulationSequence = useCallback(() => {
    simTimeRef.current = 0;
    lastTimeRef.current = performance.now();
    carPosRef.current = { x: 0, y: 0, z: 0 };
    currentSpeedRef.current = 0;
    zeroTo100AchievedRef.current = null;
    isRunningRef.current = true;

    if (carGroupRef.current) {
      carGroupRef.current.position.set(0, 0, 0);
      carGroupRef.current.rotation.set(0, 0, 0);
    }

    wheelMotionDiscsRef.current.forEach(({ mesh, material }) => {
      mesh.rotation.z = 0;
      material.opacity = 0;
    });

    setStage("READY");
  }, [setStage]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. ASYNC LOAD VEHICLE GLB MODEL, SETUP WHEEL MOTION DISCS & APPLY CUSTOMIZATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const loadVehicleModel = useCallback(async () => {
    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    if (!scene || !renderer) return;

    if (!assetManagerRef.current) {
      assetManagerRef.current = new AssetManager(renderer);
    }
    const assetManager = assetManagerRef.current;

    const currentLoadId = ++loadCounterRef.current;
    const currentVehicle = vehicleRef.current;
    const currentBuild = buildRef.current;
    const currentTelemetry = telemetryDataRef.current;

    setStage("LOADING");
    onLoadingProgressRef.current?.(true, 0.15);

    try {
      if (process.env.NODE_ENV === "development") {
        console.log("[VehicleTest] Loading vehicle model:", {
          buildId: currentBuild?.id || "none",
          vehicle: currentVehicle.id,
          glbUrl: currentVehicle.modelPath,
        });
      }

      const asset = await assetManager.load(currentVehicle.modelPath, (progress) => {
        if (loadCounterRef.current === currentLoadId) {
          onLoadingProgressRef.current?.(true, Math.max(0.15, progress));
        }
      });

      // Guard against stale asynchronous callbacks
      if (loadCounterRef.current !== currentLoadId) return;

      // 1. Remove previous car from scene if any
      if (carGroupRef.current) {
        scene.remove(carGroupRef.current);
        carGroupRef.current = null;
        wheelMotionDiscsRef.current = [];
      }

      // 2. Car presentation group
      const carGroup = new THREE.Group();
      carGroup.name = "simulation-car-root";

      // Scale vehicle down to 0.70 so the full car is comfortably framed with generous margins
      asset.pivot.scale.setScalar(0.70);

      // Keep all original CAD components (tires, rims, hubs, brakes, chassis) firmly attached
      carGroup.add(asset.pivot);

      // 3. Ground contact shadow plane beneath vehicle
      const shadowGeo = new THREE.PlaneGeometry(2.2, 4.4);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      });
      const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
      contactShadow.rotation.x = -Math.PI / 2;
      contactShadow.position.set(0, 0.015, 0);
      carGroup.add(contactShadow);

      // Configure shadow casting for all meshes
      asset.meshes.forEach((mesh) => {
        mesh.castShadow = true;
        mesh.receiveShadow = false;
      });

      // 4. Attach Dynamic Rotational Wheel Motion Discs to the 4 wheel positions
      // Group wheel meshes by corner to identify exact wheel axle centers
      const cornerGroups = new Map<string, THREE.Mesh[]>();

      asset.meshes.forEach((mesh) => {
        const name = (mesh.name || "").toLowerCase();
        const isWheelPart =
          (name.includes("wheel") ||
            name.includes("tire") ||
            name.includes("tyre") ||
            name.includes("rim") ||
            name.includes("spoke") ||
            name.includes("hub")) &&
          !name.includes("steering") &&
          !name.includes("arch") &&
          !name.includes("well") &&
          !name.includes("caliper") &&
          !name.includes("chassis") &&
          !name.includes("body");

        if (!isWheelPart) return;

        mesh.geometry.computeBoundingBox();
        const box = mesh.geometry.boundingBox;
        if (!box) return;

        const center = box.getCenter(new THREE.Vector3());
        const isFront = center.z >= 0;
        const isRight = center.x >= 0;
        const cornerKey = `${isFront ? "F" : "R"}_${isRight ? "R" : "L"}`;

        const list = cornerGroups.get(cornerKey) ?? [];
        list.push(mesh);
        cornerGroups.set(cornerKey, list);
      });

      const wheelSpinTex = createWheelSpinTexture();
      const motionDiscs: WheelMotionBlurItem[] = [];

      cornerGroups.forEach((cornerMeshes, cornerKey) => {
        if (cornerMeshes.length === 0) return;

        const cornerBox = new THREE.Box3();
        cornerMeshes.forEach((m) => {
          if (m.geometry.boundingBox) cornerBox.union(m.geometry.boundingBox);
        });
        const center = cornerBox.getCenter(new THREE.Vector3());
        const size = cornerBox.getSize(new THREE.Vector3());
        const diameter = Math.max(0.35, Math.min(size.y, size.z) * 0.98);

        const isRight = cornerKey.endsWith("_R");
        const discMat = new THREE.MeshBasicMaterial({
          map: wheelSpinTex,
          transparent: true,
          opacity: 0.0,
          depthWrite: false,
          side: THREE.DoubleSide,
        });

        const discGeo = new THREE.PlaneGeometry(diameter, diameter);
        const discMesh = new THREE.Mesh(discGeo, discMat);
        discMesh.name = `WheelMotionBlur_${cornerKey}`;

        if (isRight) {
          discMesh.rotation.y = Math.PI / 2;
          discMesh.position.set(center.x + 0.02, center.y, center.z);
        } else {
          discMesh.rotation.y = -Math.PI / 2;
          discMesh.position.set(center.x - 0.02, center.y, center.z);
        }

        // Add disc overlay directly into asset.pivot so it scales & moves seamlessly with the car
        asset.pivot.add(discMesh);
        motionDiscs.push({
          mesh: discMesh,
          material: discMat,
          isRightSide: isRight,
        });
      });

      wheelMotionDiscsRef.current = motionDiscs;

      // 5. Apply User Customizations from Saved Build
      const capabilities = GlbAnalyzer.analyze(asset);

      if (currentBuild?.vehicleCustomization) {
        const cust = currentBuild.vehicleCustomization;

        // Primary Paint
        if (capabilities.paint.supported && cust.paint?.primary) {
          const hex = cust.paint.primary;
          const metal = cust.paint.metalness ?? 0.15;
          const rough = cust.paint.roughness ?? 0.22;
          capabilities.paint.targetMaterialNames.forEach((matName) => {
            asset.meshes.forEach((m) => {
              const mat = Array.isArray(m.material) ? m.material : [m.material];
              mat.forEach((item) => {
                if (item instanceof THREE.MeshStandardMaterial && item.name === matName) {
                  item.color.set(hex);
                  item.metalness = metal;
                  item.roughness = rough;
                  item.needsUpdate = true;
                }
              });
            });
          });
        }

        // Accent Paint
        if (capabilities.accentPaint.supported && cust.paint?.secondary) {
          const hex = cust.paint.secondary;
          capabilities.accentPaint.targetMaterialNames.forEach((matName) => {
            asset.meshes.forEach((m) => {
              const mat = Array.isArray(m.material) ? m.material : [m.material];
              mat.forEach((item) => {
                if (item instanceof THREE.MeshStandardMaterial && item.name === matName) {
                  item.color.set(hex);
                  item.needsUpdate = true;
                }
              });
            });
          });
        }

        // Glass Tint
        if (capabilities.glass.supported && cust.glass?.tint) {
          const opacity = GLASS_TINT_OPACITY[cust.glass.tint] ?? 0.55;
          capabilities.glass.targetMaterialNames.forEach((matName) => {
            asset.meshes.forEach((m) => {
              const mat = Array.isArray(m.material) ? m.material : [m.material];
              mat.forEach((item) => {
                if (item instanceof THREE.MeshStandardMaterial && item.name === matName) {
                  item.opacity = opacity;
                  item.transparent = true;
                  item.needsUpdate = true;
                }
              });
            });
          });
        }

        // Rim / Wheel Color
        if (capabilities.rims.supported && cust.wheels?.rimColor) {
          const hex = cust.wheels.rimColor;
          const metal = cust.wheels.rimMetalness ?? 0.9;
          const rough = cust.wheels.rimRoughness ?? 0.15;
          capabilities.rims.targetMaterialNames.forEach((matName) => {
            asset.meshes.forEach((m) => {
              const mat = Array.isArray(m.material) ? m.material : [m.material];
              mat.forEach((item) => {
                if (item instanceof THREE.MeshStandardMaterial && item.name === matName) {
                  item.color.set(hex);
                  item.metalness = metal;
                  item.roughness = rough;
                  item.needsUpdate = true;
                }
              });
            });
          });
        }

        // Exterior Trim
        if (capabilities.trim.supported && cust.trim?.finish) {
          const pbr = TRIM_FINISH_PBR[cust.trim.finish];
          if (pbr) {
            capabilities.trim.targetMaterialNames.forEach((matName) => {
              asset.meshes.forEach((m) => {
                const mat = Array.isArray(m.material) ? m.material : [m.material];
                mat.forEach((item) => {
                  if (item instanceof THREE.MeshStandardMaterial && item.name === matName) {
                    if (pbr.color) item.color.set(pbr.color);
                    item.roughness = pbr.roughness;
                    item.metalness = pbr.metalness;
                    item.needsUpdate = true;
                  }
                });
              });
            });
          }
        }

        // Headlights
        if (capabilities.lights.supported && cust.lights?.headlightStyle) {
          const style = HEADLIGHT_STYLE_PBR[cust.lights.headlightStyle];
          if (style) {
            capabilities.lights.targetMaterialNames.forEach((matName) => {
              asset.meshes.forEach((m) => {
                const mat = Array.isArray(m.material) ? m.material : [m.material];
                mat.forEach((item) => {
                  if (item instanceof THREE.MeshStandardMaterial && item.name === matName) {
                    item.color.set(style.color);
                    item.emissive.set(style.emissive);
                    item.emissiveIntensity = style.emissiveIntensity;
                    item.needsUpdate = true;
                  }
                });
              });
            });
          }
        }
      }

      // Legacy per-mesh material overrides
      if (currentBuild?.materialOverrides) {
        Object.entries(currentBuild.materialOverrides).forEach(([meshName, config]) => {
          assetManager.updateMaterial(meshName, config);
        });
      }

      // Add assembled vehicle to scene
      scene.add(carGroup);
      carGroupRef.current = carGroup;

      if (process.env.NODE_ENV === "development") {
        const bounds = new THREE.Box3().setFromObject(carGroup);
        console.log("[VehicleTest] Scaled vehicle mounted cleanly with anchored geometry:", {
          glbLoaded: true,
          meshesCount: asset.meshes.length,
          motionDiscsCount: motionDiscs.length,
          modelBounds: bounds,
          performance: currentTelemetry,
        });
      }

      onLoadingProgressRef.current?.(false, 1.0);
      startSimulationSequence();
    } catch (err) {
      console.error("[VehicleTest] Failed to load GLB model for test experience:", err);
      onLoadingProgressRef.current?.(false, 0);
    }
  }, [setStage, startSimulationSequence]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. SCENE INITIALIZATION & TRACK BUILD (Mounts once on mount)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // High-clarity Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene with clear distant linear fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e8ecf1");
    scene.fog = new THREE.Fog(0xe8ecf1, 80, 600);
    sceneRef.current = scene;

    // Build PMREM studio environment texture
    const envTexture = buildStudioEnvironmentMap(renderer);
    scene.environment = envTexture;
    envTextureRef.current = envTexture;

    // Telephoto Camera (24 FOV)
    const camera = new THREE.PerspectiveCamera(24, 16 / 9, 0.1, 800);
    camera.position.set(5.2, 1.4, 6.6);
    camera.lookAt(0, 0.35, 0.3);
    cameraRef.current = camera;

    // ── Bright & High-Clarity Studio Proving Ground Lighting ─────────────────
    const ambientLight = new THREE.AmbientLight("#f4f7fa", 1.8);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight("#ffffff", "#d0dce8", 1.4);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight("#fffcf2", 2.8);
    sunLight.position.set(25, 45, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 150;
    const d = 25;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0002;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight("#e8f2fc", 1.8);
    fillLight.position.set(-25, 20, 35);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight("#ffffff", 1.6);
    rimLight.position.set(-30, 25, -35);
    scene.add(rimLight);

    // ── Build Proving Grounds Asphalt Track ──────────────────────────────────
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    // 1. Asphalt Runway surface (800 meters long)
    const trackLength = 800;
    const trackWidth = 14;
    const roadGeo = new THREE.PlaneGeometry(trackWidth, trackLength, 1, 64);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1e2023,
      roughness: 0.82,
      metalness: 0.12,
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, trackLength / 2 - 40);
    road.receiveShadow = true;
    trackGroup.add(road);

    // 2. Surrounding Landscape Ground
    const groundGeo = new THREE.PlaneGeometry(600, 1000);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xdde4eb,
      roughness: 0.95,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.02, trackLength / 2 - 40);
    ground.receiveShadow = true;
    trackGroup.add(ground);

    // 3. Road Markings
    const markMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xf5a623 });
    const redMat = new THREE.MeshBasicMaterial({ color: 0xe0564d });

    // Outer boundary solid lines
    const edgeLineGeo = new THREE.PlaneGeometry(0.2, trackLength);
    const leftEdge = new THREE.Mesh(edgeLineGeo, markMat);
    leftEdge.rotation.x = -Math.PI / 2;
    leftEdge.position.set(-trackWidth / 2 + 0.8, 0.005, trackLength / 2 - 40);
    trackGroup.add(leftEdge);

    const rightEdge = new THREE.Mesh(edgeLineGeo, markMat);
    rightEdge.rotation.x = -Math.PI / 2;
    rightEdge.position.set(trackWidth / 2 - 0.8, 0.005, trackLength / 2 - 40);
    trackGroup.add(rightEdge);

    // Center Dashed Lines (every 7 meters)
    const dashGeo = new THREE.PlaneGeometry(0.22, 3.5);
    for (let z = -35; z < trackLength - 40; z += 7.0) {
      const dash = new THREE.Mesh(dashGeo, markMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.006, z);
      trackGroup.add(dash);
    }

    // Starting Launch Box at z = 0
    const startLineGeo = new THREE.PlaneGeometry(trackWidth - 2, 0.8);
    const startLine = new THREE.Mesh(startLineGeo, yellowMat);
    startLine.rotation.x = -Math.PI / 2;
    startLine.position.set(0, 0.008, 0);
    trackGroup.add(startLine);

    // Checkered / Grid start bars
    for (let x = -4; x <= 4; x += 1.6) {
      const gridBarGeo = new THREE.PlaneGeometry(1.0, 0.3);
      const gridBar = new THREE.Mesh(gridBarGeo, markMat);
      gridBar.rotation.x = -Math.PI / 2;
      gridBar.position.set(x, 0.009, -2.5);
      trackGroup.add(gridBar);
    }

    // 4. Runway Side Pylons / LED Light Markers along track edges
    const pylonGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.45, 8);
    const pylonCapGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x3a3f47, roughness: 0.5 });
    const lightOrangeMat = new THREE.MeshBasicMaterial({ color: 0xff7700 });
    const lightBlueMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff });

    for (let z = -30; z < trackLength - 40; z += 15) {
      const pLeft = new THREE.Mesh(pylonGeo, pylonMat);
      pLeft.position.set(-trackWidth / 2 + 0.3, 0.22, z);
      const capLeft = new THREE.Mesh(pylonCapGeo, z > 150 ? lightBlueMat : lightOrangeMat);
      capLeft.position.set(-trackWidth / 2 + 0.3, 0.45, z);
      trackGroup.add(pLeft, capLeft);

      const pRight = new THREE.Mesh(pylonGeo, pylonMat);
      pRight.position.set(trackWidth / 2 - 0.3, 0.22, z);
      const capRight = new THREE.Mesh(pylonCapGeo, z > 150 ? lightBlueMat : lightOrangeMat);
      capRight.position.set(trackWidth / 2 - 0.3, 0.45, z);
      trackGroup.add(pRight, capRight);
    }

    // 5. Track Distance Markers & Overhead Signboards
    const distancePoints = [
      { z: 50, label: "50 M" },
      { z: 100, label: "100 M" },
      { z: 160, label: "0-100 KM/H" },
      { z: 250, label: "250 M" },
      { z: 402, label: "1/4 MILE" },
      { z: 550, label: "FINISH" },
    ];

    distancePoints.forEach((pt) => {
      const boardGeo = new THREE.BoxGeometry(0.15, 0.9, 1.8);
      const boardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const signPostGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4);
      const signPostMat = new THREE.MeshStandardMaterial({ color: 0x4a4f55 });

      const postL = new THREE.Mesh(signPostGeo, signPostMat);
      postL.position.set(-trackWidth / 2 - 1.2, 0.7, pt.z);
      const boardL = new THREE.Mesh(boardGeo, boardMat);
      boardL.position.set(-trackWidth / 2 - 1.2, 1.35, pt.z);
      boardL.rotation.y = Math.PI / 2;
      trackGroup.add(postL, boardL);

      const postR = new THREE.Mesh(signPostGeo, signPostMat);
      postR.position.set(trackWidth / 2 + 1.2, 0.7, pt.z);
      const boardR = new THREE.Mesh(boardGeo, boardMat);
      boardR.position.set(trackWidth / 2 + 1.2, 1.35, pt.z);
      boardR.rotation.y = -Math.PI / 2;
      trackGroup.add(postR, boardR);

      const stripeGeo = new THREE.PlaneGeometry(trackWidth - 1.6, 0.4);
      const stripe = new THREE.Mesh(stripeGeo, pt.label.includes("100") || pt.label.includes("FINISH") ? redMat : yellowMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(0, 0.007, pt.z);
      trackGroup.add(stripe);
    });

    // ── Resize Observer for Robust Viewport Updates ───────────────────────────
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // ── Continuous Animation & Render Loop ───────────────────────────────────
    const targetTopSpeed = 105;

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      const car = carGroupRef.current;
      const telemetry = telemetryDataRef.current;
      const zeroTo100Sec = telemetry.zeroTo100Time;
      const launchTime = 1.8;
      const accelEndTime = launchTime + zeroTo100Sec;

      if (isRunningRef.current && car) {
        simTimeRef.current += dt;
        const t = simTimeRef.current;

        let speedKmH = 0;
        let rpm = 950;
        let gear = 1;
        let gForce = 0;

        // ── Phase 1: REVEAL / READY (0s to 1.8s) ──────────────────────────
        if (t < launchTime) {
          if (stageRef.current !== "READY") setStage("READY");
          speedKmH = 0;
          rpm = 950 + Math.sin(t * 8) * 120;
          gear = 1;
          gForce = 0;

          // Camera: Balanced 3/4 tracking view with generous margins
          camera.position.set(5.2, 1.4, 6.6);
          camera.lookAt(0, 0.35, 0.3);
        }
        // ── Phase 2: LAUNCH & ACCELERATION (1.8s to accelEndTime) ────────
        else if (t >= launchTime && t < accelEndTime) {
          const accelProgress = (t - launchTime) / zeroTo100Sec;

          if (accelProgress < 0.1) {
            if (stageRef.current !== "LAUNCH") setStage("LAUNCH");
          } else {
            if (stageRef.current !== "ACCELERATING") setStage("ACCELERATING");
          }

          const normalizedSpeed = Math.sin((accelProgress * Math.PI) / 2);
          speedKmH = normalizedSpeed * 100;

          if (accelProgress < 0.28) {
            gear = 1;
            rpm = 1800 + (accelProgress / 0.28) * 5600;
          } else if (accelProgress < 0.62) {
            gear = 2;
            rpm = 3800 + ((accelProgress - 0.28) / 0.34) * 4000;
          } else {
            gear = 3;
            rpm = 4400 + ((accelProgress - 0.62) / 0.38) * 3200;
          }

          gForce = telemetry.peakGForce * (1.15 - accelProgress * 0.4) + (Math.random() - 0.5) * 0.04;

          const speedMps = (speedKmH * 1000) / 3600;
          carPosRef.current.z += speedMps * dt;
          car.position.z = carPosRef.current.z;

          const squatPitch = accelProgress < 0.15 ? -0.018 * (1 - accelProgress / 0.15) : 0;
          car.rotation.x = squatPitch;

          // Dynamic Camera Tracking alongside the accelerating car
          const carZ = car.position.z;
          camera.position.set(5.2, 1.4, carZ + 6.6);
          camera.lookAt(0, 0.35, carZ + 0.3);
        }
        // ── Phase 3: TARGET SPEED & VERIFICATION ─────────────────────────
        else if (t >= accelEndTime && t < accelEndTime + 1.8) {
          if (stageRef.current !== "TARGET_SPEED") {
            setStage("TARGET_SPEED");
            zeroTo100AchievedRef.current = zeroTo100Sec;
          }

          const topProgress = (t - accelEndTime) / 1.8;
          speedKmH = 100 + topProgress * (targetTopSpeed - 100);
          gear = 4;
          rpm = 5400 + Math.sin(t * 12) * 80;
          gForce = 0.15 + (Math.random() - 0.5) * 0.02;

          const speedMps = (speedKmH * 1000) / 3600;
          carPosRef.current.z += speedMps * dt;
          car.position.z = carPosRef.current.z;

          const carZ = car.position.z;
          camera.position.set(5.2, 1.4, carZ + 6.6);
          camera.lookAt(0, 0.35, carZ + 0.3);
        }
        // ── Phase 4: DECELERATION & BRAKING ──────────────────────────────
        else if (t >= accelEndTime + 1.8 && t < accelEndTime + 3.6) {
          if (stageRef.current !== "DECELERATING") setStage("DECELERATING");

          const decelProgress = (t - (accelEndTime + 1.8)) / 1.8;
          const remainingFactor = Math.max(0, 1.0 - Math.pow(decelProgress, 1.5));
          speedKmH = targetTopSpeed * remainingFactor;
          gear = Math.max(1, Math.round(4 * remainingFactor));
          rpm = 950 + speedKmH * 35;
          gForce = -0.85 * remainingFactor;

          const speedMps = (speedKmH * 1000) / 3600;
          carPosRef.current.z += speedMps * dt;
          car.position.z = carPosRef.current.z;

          car.rotation.x = speedKmH > 5 ? 0.012 * remainingFactor : 0;

          const carZ = car.position.z;
          camera.position.set(5.2, 1.4, carZ + 6.6);
          camera.lookAt(0, 0.35, carZ + 0.3);
        }
        // ── Phase 5: COMPLETED / STATIONARY STATE ─────────────────────────
        else {
          if (stageRef.current !== "HERO") {
            setStage("HERO");
          }
          speedKmH = 0;
          rpm = 850;
          gear = 0;
          gForce = 0;
          car.rotation.x = 0;

          // Camera frames the stationary vehicle comfortably centered in the viewport
          const carZ = car.position.z;
          camera.position.set(4.6, 1.35, carZ + 7.5);
          camera.lookAt(-0.55, 0.32, carZ + 0.2);
        }

        // Animate Wheel Rotational Motion Blur Discs
        const speedMps = (speedKmH * 1000) / 3600;
        const wheelSpinSpeed = (speedMps * dt) / 0.28;
        const targetOpacity = Math.min(0.68, (speedKmH / 65) * 0.68);

        wheelMotionDiscsRef.current.forEach(({ mesh, material, isRightSide }) => {
          mesh.rotation.z += isRightSide ? -wheelSpinSpeed : wheelSpinSpeed;
          material.opacity = targetOpacity;
        });

        currentSpeedRef.current = speedKmH;

        onTelemetryUpdateRef.current?.({
          speedKmH: Math.round(speedKmH),
          rpm: Math.round(rpm),
          gear,
          gForce: Math.round(gForce * 100) / 100,
          elapsedTime: Math.max(0, t - launchTime),
          distanceMeters: Math.round(carPosRef.current.z),
          stage: stageRef.current,
          zeroTo100TimeReached: zeroTo100AchievedRef.current,
        });
      }

      renderer.render(scene, camera);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    // Initial vehicle model load
    void loadVehicleModel();

    return () => {
      resizeObserver.disconnect();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      envTextureRef.current?.dispose();
      renderer.dispose();
    };
  }, [loadVehicleModel, setStage]);

  // Handle vehicle/build changes without tearing down the scene
  useEffect(() => {
    if (sceneRef.current && rendererRef.current) {
      void loadVehicleModel();
    }
  }, [vehicle.modelPath, build?.id, build?.savedAt, loadVehicleModel]);

  // Handle replay trigger from parent component
  useEffect(() => {
    if (replayTrigger > 0 && carGroupRef.current) {
      startSimulationSequence();
    }
  }, [replayTrigger, startSimulationSequence]);

  return (
    <div className="absolute inset-0 w-full h-full min-h-[380px] rounded-3xl overflow-hidden bg-[#e8ecf1]">
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
