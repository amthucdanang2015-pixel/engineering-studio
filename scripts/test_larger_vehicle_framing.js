import * as THREE from "three";

// Vehicle dimensions:
// Length: 4.60m, Height: 1.86m
// Plinth Y = -0.85 + 0.17 = -0.68m (wheels at Y = -0.68, roof at Y = +1.02)
// Vertical center of car: Y = +0.17m

const vehHeight = 1.70; // after FIT_SIZE scaling
const vehLength = 4.20;
const centerY = 0.17;

const fov = 32; // degrees
const fovRad = THREE.MathUtils.degToRad(fov);

const testDistances = [
  { dist: 4.95, label: "Current distance (4.95m)" },
  { dist: 3.80, label: "Closer distance (3.80m)" },
  { dist: 3.20, label: "Optimal prominent distance (3.20m)" },
];

console.log("=== VEHICLE VISUAL SIZE COMPARISON ===");

testDistances.forEach(({ dist, label }) => {
  const frustumH = 2 * dist * Math.tan(fovRad / 2);
  const frustumW = frustumH * (1512 / 712); // desktop aspect

  const heightPct = (vehHeight / frustumH) * 100;
  const widthPct = (vehLength / frustumW) * 100;

  console.log(`\n${label}:`);
  console.log(`  Camera Position: (0.00, 0.17, ${dist.toFixed(2)})`);
  console.log(`  Camera Target  : (0.00, 0.17, 0.00)`);
  console.log(`  Frustum Size   : ${frustumW.toFixed(2)}m x ${frustumH.toFixed(2)}m`);
  console.log(`  Vehicle Height : ${heightPct.toFixed(1)}% of viewport height`);
  console.log(`  Vehicle Width  : ${widthPct.toFixed(1)}% of viewport width`);
});
