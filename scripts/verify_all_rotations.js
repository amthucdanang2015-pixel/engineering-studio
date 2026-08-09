import * as THREE from "three";

// GLB Raw Node Accessor Min/Max Centers from inspect_glb.js:
// Hood/Front: X: -2.5, Rear Exhaust: X: +2.2
// Left Wheel: Y: -1.0, Right Wheel: Y: +1.0
// Wheels Bottom: Z: +0.2, Roof/Windshield Top: Z: +2.3, Chassis Floor: Z: +0.6

const roofTop = new THREE.Vector3(0, 0, 2.3);       // Roof canopy
const chassisFloor = new THREE.Vector3(0, 0, 0.6);  // Underbody chassis floor
const wheelBottom = new THREE.Vector3(0, -1.0, 0.2); // Bottom of wheel
const frontBumper = new THREE.Vector3(-2.5, 0, 0.8); // Front nose
const rearBumper = new THREE.Vector3(2.2, 0, 0.8);   // Rear deck

const eulerSteps = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

console.log("=== TESTING ALL 24 EULER ROTATIONS ===");

let foundCount = 0;

for (const x of eulerSteps) {
  for (const y of eulerSteps) {
    for (const z of eulerSteps) {
      const euler = new THREE.Euler(x, y, z, "YXZ");

      const r = roofTop.clone().applyEuler(euler);
      const c = chassisFloor.clone().applyEuler(euler);
      const w = wheelBottom.clone().applyEuler(euler);
      const f = frontBumper.clone().applyEuler(euler);
      const b = rearBumper.clone().applyEuler(euler);

      // Criteria:
      // 1. Roof Y must be significantly GREATER than Chassis Floor Y and Wheel Y (Roof on top!)
      // 2. Chassis Floor Y must be LESS than Roof Y (Floor underneath roof!)
      // 3. Front Bumper Z should be > Rear Bumper Z (Front facing +Z camera!)
      const isUpright = r.y > c.y && c.y > w.y;
      const isFrontFacingCamera = f.z > b.z;

      if (isUpright && isFrontFacingCamera) {
        foundCount++;
        console.log(`\nSUCCESS MATCH #${foundCount}: rot=(${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`);
        console.log(`  Roof Y: ${r.y.toFixed(2)}, Chassis Y: ${c.y.toFixed(2)}, Wheel Y: ${w.y.toFixed(2)}`);
        console.log(`  Front Bumper Z: ${f.z.toFixed(2)}, Rear Bumper Z: ${b.z.toFixed(2)}`);
      }
    }
  }
}
