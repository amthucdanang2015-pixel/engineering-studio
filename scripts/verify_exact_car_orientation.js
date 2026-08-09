import * as THREE from "three";

// Real GLB node centers in GLB raw space:
// Hood/Front: (-2.45, 0, 0.8)
// Rear Deck: (+1.8, 0, 1.4)
// Windshield (Top/Roof): (0, 0, 1.85)
// Chassis Floor (Underbody): (0, 0, 0.6)
// Left Wheel: (-1.35, -1.0, 0.65)
// Right Wheel: (-1.35, +1.0, 0.65)

const windshieldRoof = new THREE.Vector3(0, 0, 1.85);
const chassisFloor = new THREE.Vector3(0, 0, 0.6);
const frontBumper = new THREE.Vector3(-2.45, 0, 0.8);
const rearDeck = new THREE.Vector3(1.8, 0, 1.4);

// Initial Camera position in 3/4 view: (4.8, 1.8, 6.2) looking at (0, 0.25, 0)
const cameraPos = new THREE.Vector3(4.8, 1.8, 6.2);

const eulerSteps = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
const orders = ["XYZ", "YXZ", "ZXY", "ZYX"];

console.log("=== EXACT CAR ORIENTATION TEST ===");

let matchIdx = 0;

for (const x of eulerSteps) {
  for (const y of eulerSteps) {
    for (const z of eulerSteps) {
      for (const order of orders) {
        const euler = new THREE.Euler(x, y, z, order);

        const r = windshieldRoof.clone().applyEuler(euler);
        const c = chassisFloor.clone().applyEuler(euler);
        const f = frontBumper.clone().applyEuler(euler);
        const b = rearDeck.clone().applyEuler(euler);

        // Conditions for a perfect upright, front-facing sports car:
        // 1. Windshield/Roof Y MUST be greater than Chassis Floor Y (r.y > c.y)
        // 2. Chassis Floor Y MUST be below Roof (c.y < r.y)
        // 3. Front Bumper must face the camera side (distFrontToCam < distRearToCam)
        const isUpright = r.y > 1.2 && c.y < 0.8 && r.y > c.y;
        const distFrontToCam = f.distanceTo(cameraPos);
        const distRearToCam = b.distanceTo(cameraPos);
        const isFrontCloserToCam = distFrontToCam < distRearToCam;

        if (isUpright && isFrontCloserToCam) {
          matchIdx++;
          console.log(`\nMATCH #${matchIdx}: euler=(${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}, "${order}")`);
          console.log(`  Roof Y: ${r.y.toFixed(2)}, Chassis Y: ${c.y.toFixed(2)}`);
          console.log(`  Front Bumper: (${f.x.toFixed(2)}, ${f.y.toFixed(2)}, ${f.z.toFixed(2)})`);
          console.log(`  Dist to Cam: Front=${distFrontToCam.toFixed(2)}, Rear=${distRearToCam.toFixed(2)}`);
        }
      }
    }
  }
}
