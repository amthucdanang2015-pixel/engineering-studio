import * as THREE from "three";

// Simulated vehicle scene graph:
const scene = new THREE.Scene();
const presentationRoot = new THREE.Group();
presentationRoot.position.set(0, -0.68, 0);

const vehicleRoot = new THREE.Group();
presentationRoot.add(vehicleRoot);
scene.add(presentationRoot);

// Load dummy model bounds representing Car 2 (Classic Electric SUV)
const dummyMesh = new THREE.Mesh(
  new THREE.BoxGeometry(4.845 * (4.2 / 4.845), 2.087 * (4.2 / 4.845), 2.350 * (4.2 / 4.845)),
  new THREE.MeshBasicMaterial()
);
// Offset mesh so wheels rest at Y = 0 local
dummyMesh.position.set(0, (2.087 * (4.2 / 4.845)) / 2, 0);
vehicleRoot.add(dummyMesh);

// Force update world matrix
scene.updateMatrixWorld(true);

const box = new THREE.Box3().setFromObject(vehicleRoot);
const size = box.getSize(new THREE.Vector3());
const center = box.getCenter(new THREE.Vector3());

console.log("=== VERIFYING WORLD SPACE BOUNDING BOX & CAMERA FRAMING ===");
console.log(`World Box Min   : (${box.min.x.toFixed(3)}, ${box.min.y.toFixed(3)}, ${box.min.z.toFixed(3)})`);
console.log(`World Box Max   : (${box.max.x.toFixed(3)}, ${box.max.y.toFixed(3)}, ${box.max.z.toFixed(3)})`);
console.log(`World Box Center: (${center.x.toFixed(3)}, ${center.y.toFixed(3)}, ${center.z.toFixed(3)})`);
console.log(`World Box Size  : (${size.x.toFixed(3)}, ${size.y.toFixed(3)}, ${size.z.toFixed(3)})`);

const camera = new THREE.PerspectiveCamera(32, 1512 / 712, 0.1, 100);
const fovRad = THREE.MathUtils.degToRad(32);

let frustumH = size.y / 0.70;
let frustumW = frustumH * camera.aspect;
if (frustumW < size.x / 0.80) {
  frustumW = size.x / 0.80;
  frustumH = frustumW / camera.aspect;
}

const dist = frustumH / (2 * Math.tan(fovRad / 2));

camera.position.set(center.x, center.y, center.z + dist);
camera.lookAt(center.x, center.y, center.z);
camera.updateMatrixWorld();
camera.updateProjectionMatrix();

// Project roof, center, and wheels into NDC and screen Y %
const pCenter = center.clone().project(camera);
const pRoof = new THREE.Vector3(center.x, box.max.y, center.z).project(camera);
const pWheels = new THREE.Vector3(center.x, box.min.y, center.z).project(camera);

const screenCenterY = (1 - pCenter.y) / 2 * 100;
const screenRoofY = (1 - pRoof.y) / 2 * 100;
const screenWheelsY = (1 - pWheels.y) / 2 * 100;

console.log(`\nFraming Results:`);
console.log(`  Camera Position : (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${(center.z + dist).toFixed(2)})`);
console.log(`  Camera Target   : (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`);
console.log(`  Car Center Y %  : ${screenCenterY.toFixed(1)}% (50.0% is exact middle of screen)`);
console.log(`  Car Roof Y %    : ${screenRoofY.toFixed(1)}% from top`);
console.log(`  Car Wheels Y %  : ${screenWheelsY.toFixed(1)}% from top`);
console.log(`  Car Height %    : ${(screenWheelsY - screenRoofY).toFixed(1)}% of viewport height`);
