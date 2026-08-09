import fs from "fs";
import path from "path";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Load public/models/ESF_V2_Classic_Sports_Car_Demo_ThreeJS_YUp.glb
const glbPath = path.resolve("./public/models/ESF_V2_Classic_Sports_Car_Demo_ThreeJS_YUp.glb");
const buffer = fs.readFileSync(glbPath);

const loader = new GLTFLoader();

loader.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), "", (gltf) => {
  const model = gltf.scene;
  model.rotation.set(0, 0, 0);
  model.updateMatrixWorld(true);

  // Exact scale calculation in AssetManager.ts
  const VIEWER_CONFIG = {
    FIT_SIZE: 4.2,
    CAMERA_FOV: 32,
    PLINTH_Y: -0.85,
  };

  const rawBox = new THREE.Box3().setFromObject(model);
  const rawSize = rawBox.getSize(new THREE.Vector3());
  const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z, 0.001);
  const scale = VIEWER_CONFIG.FIT_SIZE / maxDim;

  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);

  const scaledBox = new THREE.Box3().setFromObject(model);
  const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

  model.position.x = -scaledCenter.x;
  model.position.z = -scaledCenter.z;
  model.position.y = -scaledBox.min.y; // Lowest point sits at Y = 0

  const pivot = new THREE.Group();
  pivot.add(model);

  // 1. Scene Graph Hierarchy setup matching AnatomyViewer.ts
  const scene = new THREE.Scene();
  const vehiclePresentationRoot = new THREE.Group();
  vehiclePresentationRoot.name = "VehiclePresentationRoot";

  const platformTopY = VIEWER_CONFIG.PLINTH_Y + 0.17; // -0.68
  vehiclePresentationRoot.position.set(0, platformTopY, 0);

  const vehicleRoot = new THREE.Group();
  vehicleRoot.name = "VehicleRoot";
  vehicleRoot.add(pivot);

  vehiclePresentationRoot.add(vehicleRoot);
  scene.add(vehiclePresentationRoot);

  // Update world matrices for whole scene
  scene.updateMatrixWorld(true);

  // 2. Inspect Container & Camera
  const containerWidth = 1512;
  const containerHeight = 712;
  const aspect = containerWidth / containerHeight;

  const camera = new THREE.PerspectiveCamera(VIEWER_CONFIG.CAMERA_FOV, aspect, 0.1, 100);

  // 3. World Box of vehicleRoot
  const worldBox = new THREE.Box3().setFromObject(vehicleRoot);
  const worldSize = worldBox.getSize(new THREE.Vector3());
  const worldCenter = worldBox.getCenter(new THREE.Vector3());

  console.log("=================================================");
  console.log("ACTUAL THREE.JS RUNTIME DIAGNOSTIC");
  console.log("=================================================");

  console.log("\n1. CANVAS CONTAINER:");
  console.log(`   Width        : ${containerWidth}px`);
  console.log(`   Height       : ${containerHeight}px`);
  console.log(`   Aspect Ratio : ${aspect.toFixed(3)}`);

  console.log("\n2. LOADED VEHICLE BOUNDS (worldBox setFromObject(vehicleRoot)):");
  console.log(`   World Min    : (${worldBox.min.x.toFixed(3)}, ${worldBox.min.y.toFixed(3)}, ${worldBox.min.z.toFixed(3)})`);
  console.log(`   World Max    : (${worldBox.max.x.toFixed(3)}, ${worldBox.max.y.toFixed(3)}, ${worldBox.max.z.toFixed(3)})`);
  console.log(`   Actual Width : ${worldSize.x.toFixed(3)}m`);
  console.log(`   Actual Height: ${worldSize.y.toFixed(3)}m`);
  console.log(`   Actual Depth : ${worldSize.z.toFixed(3)}m`);
  console.log(`   Actual Center: (${worldCenter.x.toFixed(3)}, ${worldCenter.y.toFixed(3)}, ${worldCenter.z.toFixed(3)})`);

  console.log("\n3. VEHICLE PRESENTATION ROOT & VEHICLE ROOT:");
  console.log(`   Presentation Pos  : (${vehiclePresentationRoot.position.x.toFixed(3)}, ${vehiclePresentationRoot.position.y.toFixed(3)}, ${vehiclePresentationRoot.position.z.toFixed(3)})`);
  console.log(`   Presentation Scale: (${vehiclePresentationRoot.scale.x.toFixed(3)}, ${vehiclePresentationRoot.scale.y.toFixed(3)}, ${vehiclePresentationRoot.scale.z.toFixed(3)})`);
  console.log(`   VehicleRoot Pos   : (${vehicleRoot.position.x.toFixed(3)}, ${vehicleRoot.position.y.toFixed(3)}, ${vehicleRoot.position.z.toFixed(3)})`);
  console.log(`   VehicleRoot Rot   : (${vehicleRoot.rotation.x.toFixed(3)}, ${vehicleRoot.rotation.y.toFixed(3)}, ${vehicleRoot.rotation.z.toFixed(3)})`);

  // 4. Test Current Camera Position & Target vs FrameObject calculation
  const fovRad = THREE.MathUtils.degToRad(VIEWER_CONFIG.CAMERA_FOV);

  let frustumH = worldSize.y / 0.70;
  let frustumW = frustumH * aspect;
  if (frustumW < worldSize.x / 0.80) {
    frustumW = worldSize.x / 0.80;
    frustumH = frustumW / aspect;
  }

  const calculatedDist = frustumH / (2 * Math.tan(fovRad / 2));

  console.log("\n4. CAMERA FRAMING CALCULATION:");
  console.log(`   FOV              : ${VIEWER_CONFIG.CAMERA_FOV}°`);
  console.log(`   Calculated Target: (${worldCenter.x.toFixed(3)}, ${worldCenter.y.toFixed(3)}, ${worldCenter.z.toFixed(3)})`);
  console.log(`   Calculated Pos Z : ${(worldCenter.z + calculatedDist).toFixed(3)}m`);
  console.log(`   Frustum Size     : ${frustumW.toFixed(3)}m (W) x ${frustumH.toFixed(3)}m (H)`);

  // 5. Test NDC Projection
  camera.position.set(worldCenter.x, worldCenter.y, worldCenter.z + calculatedDist);
  camera.lookAt(worldCenter.x, worldCenter.y, worldCenter.z);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();

  const pRoof = new THREE.Vector3(worldCenter.x, worldBox.max.y, worldCenter.z).project(camera);
  const pWheels = new THREE.Vector3(worldCenter.x, worldBox.min.y, worldCenter.z).project(camera);

  const screenRoofY = (1 - pRoof.y) / 2 * 100;
  const screenWheelsY = (1 - pWheels.y) / 2 * 100;

  console.log("\n5. VIEWPORT NDC SCREEN PROJECTION:");
  console.log(`   Roof Y Screen   : ${screenRoofY.toFixed(1)}% from top of canvas`);
  console.log(`   Wheels Y Screen : ${screenWheelsY.toFixed(1)}% from top of canvas`);
  console.log(`   Vehicle Height  : ${(screenWheelsY - screenRoofY).toFixed(1)}% of canvas height`);

}, (err) => {
  console.error("GLTF Load Error:", err);
});
