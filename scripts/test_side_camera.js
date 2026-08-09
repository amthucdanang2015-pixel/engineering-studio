import * as THREE from "three";

// Canonical model transformation: model.rotation.set(-Math.PI / 2, 0, Math.PI, "YXZ")
// Let's test camera position at (7.2, 0.65, 0) looking at (0, 0.45, 0)
const euler = new THREE.Euler(-Math.PI / 2, 0, Math.PI, "YXZ");

const rawFront = new THREE.Vector3(-2.45, 0, 0.8);  // Front nose
const rawRear = new THREE.Vector3(1.8, 0, 1.4);      // Rear deck
const rawRoof = new THREE.Vector3(0, 0, 1.85);       // Roof
const rawRightWheel = new THREE.Vector3(-1.35, 1.0, 0.65); // Right wheel
const rawLeftWheel = new THREE.Vector3(-1.35, -1.0, 0.65); // Left wheel

const f = rawFront.applyEuler(euler);
const r = rawRear.applyEuler(euler);
const roof = rawRoof.applyEuler(euler);
const wR = rawRightWheel.applyEuler(euler);
const wL = rawLeftWheel.applyEuler(euler);

console.log("=== CANONICAL MODEL WORLD POSITIONS ===");
console.log(`Front nose: (${f.x.toFixed(2)}, ${f.y.toFixed(2)}, ${f.z.toFixed(2)})`);
console.log(`Rear deck:  (${r.x.toFixed(2)}, ${r.y.toFixed(2)}, ${r.z.toFixed(2)})`);
console.log(`Roof top:   (${roof.x.toFixed(2)}, ${roof.y.toFixed(2)}, ${roof.z.toFixed(2)})`);
console.log(`Right wheel:(${wR.x.toFixed(2)}, ${wR.y.toFixed(2)}, ${wR.z.toFixed(2)})`);
console.log(`Left wheel: (${wL.x.toFixed(2)}, ${wL.y.toFixed(2)}, ${wL.z.toFixed(2)})`);

console.log("\n=== SIDE VIEW CAMERA (7.2, 0.65, 0) ===");
const cam = new THREE.Vector3(7.2, 0.65, 0);
console.log(`Dist to Right Wheel: ${wR.distanceTo(cam).toFixed(2)}`);
console.log(`Dist to Left Wheel: ${wL.distanceTo(cam).toFixed(2)}`);
console.log(`Dist to Front: ${f.distanceTo(cam).toFixed(2)}`);
console.log(`Dist to Rear: ${r.distanceTo(cam).toFixed(2)}`);
