import * as THREE from "three";

// Raw GLB node centers:
const windshield = new THREE.Vector3(0.05, 0.00, 1.86);       // Roof
const chassis = new THREE.Vector3(0.00, 0.00, 0.62);          // Underbody floor
const wheelFL = new THREE.Vector3(-1.35, -1.00, 0.20);        // Front Left Wheel (bottom)
const wheelFR = new THREE.Vector3(-1.35, 1.00, 0.20);         // Front Right Wheel (bottom)
const frontBumper = new THREE.Vector3(-2.42, 0.00, 0.83);     // Front Nose
const rearExhaust = new THREE.Vector3(2.12, 0.00, 0.86);      // Rear Exhaust

const candidates = [
  { name: "Option A", euler: new THREE.Euler(-Math.PI / 2, 0, -Math.PI / 2, "YXZ") },
  { name: "Option B", euler: new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2, "YXZ") },
  { name: "Option C", euler: new THREE.Euler(-Math.PI / 2, Math.PI / 2, 0, "YXZ") },
  { name: "Option D", euler: new THREE.Euler(-Math.PI / 2, -Math.PI / 2, 0, "YXZ") },
  { name: "Option E", euler: new THREE.Euler(-Math.PI / 2, 0, 0, "YXZ") },
];

console.log("=================================================");
console.log("CANONICAL THREE.JS WORLD TRANSFORM EVALUATION");
console.log("=================================================");

candidates.forEach(({ name, euler }) => {
  const r = windshield.clone().applyEuler(euler);
  const c = chassis.clone().applyEuler(euler);
  const wL = wheelFL.clone().applyEuler(euler);
  const wR = wheelFR.clone().applyEuler(euler);
  const f = frontBumper.clone().applyEuler(euler);
  const b = rearExhaust.clone().applyEuler(euler);

  console.log(`\n--- ${name}: rot=(${euler.x.toFixed(2)}, ${euler.y.toFixed(2)}, ${euler.z.toFixed(2)}, "${euler.order}") ---`);
  console.log(`  Roof Y_w      : ${r.y.toFixed(2)}  (MUST be highest)`);
  console.log(`  Chassis Y_w   : ${c.y.toFixed(2)}  (MUST be between roof & wheels)`);
  console.log(`  WheelFL Y_w   : ${wL.y.toFixed(2)}  (MUST be lowest)`);
  console.log(`  WheelFR Y_w   : ${wR.y.toFixed(2)}  (MUST be lowest)`);
  console.log(`  Front Bumper  : (${f.x.toFixed(2)}, ${f.y.toFixed(2)}, ${f.z.toFixed(2)})`);
  console.log(`  Rear Exhaust  : (${b.x.toFixed(2)}, ${b.y.toFixed(2)}, ${b.z.toFixed(2)})`);
  console.log(`  Left Wheel Z_w: ${wL.z.toFixed(2)}, Right Wheel Z_w: ${wR.z.toFixed(2)}`);
});
