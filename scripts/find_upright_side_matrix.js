import * as THREE from "three";

// GLB Raw coordinates:
// Roof: (0, 0, 1.85)
// Wheel bottom: (0, 1.0, 0.20)
// Chassis floor: (0, 0, 0.60)
// Front nose: (-2.45, 0, 0.8)
// Right side door: (0, 1.0, 1.2)

const roof = new THREE.Vector3(0, 0, 1.85);
const wheel = new THREE.Vector3(0, 1.0, 0.20);
const chassis = new THREE.Vector3(0, 0, 0.60);
const front = new THREE.Vector3(-2.45, 0, 0.8);
const door = new THREE.Vector3(0, 1.0, 1.2);

const eulerSteps = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
const orders = ["XYZ", "YXZ", "ZXY", "ZYX"];

console.log("=== UPRIGHT SIDE PROFILE ROTATION SEARCH ===");

let count = 0;

for (const x of eulerSteps) {
  for (const y of eulerSteps) {
    for (const z of eulerSteps) {
      for (const order of orders) {
        const euler = new THREE.Euler(x, y, z, order);

        const r = roof.clone().applyEuler(euler);
        const w = wheel.clone().applyEuler(euler);
        const c = chassis.clone().applyEuler(euler);
        const f = front.clone().applyEuler(euler);
        const d = door.clone().applyEuler(euler);

        // Required criteria:
        // 1. Roof Y MUST be positive and greater than Wheel Y & Chassis Y: r.y > w.y && r.y > c.y
        // 2. Wheel Y MUST be the lowest point: w.y < c.y && w.y < r.y
        // 3. Right side door MUST face +Z towards camera: d.z > 0.8
        const isUpright = r.y > 1.2 && w.y < 0.3 && r.y > c.y && c.y > w.y;
        const isSideFacingCamera = Math.abs(d.z) > 0.8;

        if (isUpright && isSideFacingCamera) {
          count++;
          console.log(`\nMATCH #${count}: euler=(${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}, "${order}")`);
          console.log(`  Roof Y: ${r.y.toFixed(2)}, Chassis Y: ${c.y.toFixed(2)}, Wheel Y: ${w.y.toFixed(2)}`);
          console.log(`  Door Z (faces camera): ${d.z.toFixed(2)}`);
          console.log(`  Front X: ${f.x.toFixed(2)}`);
        }
      }
    }
  }
}
