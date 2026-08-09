import * as THREE from "three";

// Build a dummy box with GLB coordinates:
// Front = X: -2.5, Rear = X: +2.5
// Left = Y: -1.0, Right = Y: +1.0
// Bottom (Wheels) = Z: 0.2, Top (Roof/Windshield) = Z: 2.3

const frontHeadlight = new THREE.Vector3(-2.5, 0, 1.2);
const rearExhaust = new THREE.Vector3(2.2, 0, 0.8);
const roofTop = new THREE.Vector3(0, 0, 2.3);
const wheelBottom = new THREE.Vector3(0, 1.0, 0.2);

const angles = [
  { x: -Math.PI / 2, y: 0, z: 0 },
  { x: -Math.PI / 2, y: Math.PI / 2, z: 0 },
  { x: -Math.PI / 2, y: -Math.PI / 2, z: 0 },
  { x: -Math.PI / 2, y: Math.PI, z: 0 },
  { x: Math.PI / 2, y: 0, z: 0 },
  { x: Math.PI / 2, y: Math.PI / 2, z: 0 },
];

angles.forEach(({ x, y, z }, idx) => {
  const euler = new THREE.Euler(x, y, z, "YXZ");
  const f = frontHeadlight.clone().applyEuler(euler);
  const r = roofTop.clone().applyEuler(euler);
  const w = wheelBottom.clone().applyEuler(euler);

  console.log(`\n--- Test [${idx}]: rot=(${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}) ---`);
  console.log(`Roof Y (should be > Wheel Y): Roof Y = ${r.y.toFixed(2)}, Wheel Y = ${w.y.toFixed(2)}`);
  console.log(`Front Headlight pos: (${f.x.toFixed(2)}, ${f.y.toFixed(2)}, ${f.z.toFixed(2)})`);
});
