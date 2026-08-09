import * as THREE from "three";

// Presentation Y bounds of vehicle:
// Platform top: Y = -0.68m (wheels rest at -0.68m)
// Roof top: Y = +1.02m
// Total vehicle height: 1.70m

const roofY = 1.02;
const wheelsY = -0.68;
const plinthY = -0.85;

const targetYs = [0.25, 0.17, 0.05, -0.10, -0.18];
const cameraZ = 3.80;
const fov = 32;
const fovRad = THREE.MathUtils.degToRad(fov);
const frustumH = 2 * cameraZ * Math.tan(fovRad / 2); // 2.18m vertical frustum height

console.log("=== VERTICAL CENTERING EVALUATION ===");
console.log(`Frustum Height: ${frustumH.toFixed(2)}m (total vertical height visible in 3D viewport)`);

targetYs.forEach((targetY) => {
  // Compute screen Y percentage for roof, wheels, and plinth relative to viewport top (0%) and bottom (100%)
  // Center of viewport (50%) corresponds to world Y = targetY
  const topScreenYPct = 50 - ((roofY - targetY) / frustumH) * 100;
  const bottomScreenYPct = 50 - ((wheelsY - targetY) / frustumH) * 100;
  const plinthScreenYPct = 50 - ((plinthY - targetY) / frustumH) * 100;

  const carScreenHeightPct = bottomScreenYPct - topScreenYPct;
  const emptyBottomPct = 100 - plinthScreenYPct;

  console.log(`\nTarget Y = ${targetY.toFixed(2)}m:`);
  console.log(`  Roof position   : ${topScreenYPct.toFixed(1)}% from top of screen`);
  console.log(`  Wheels position : ${bottomScreenYPct.toFixed(1)}% from top of screen`);
  console.log(`  Plinth position : ${plinthScreenYPct.toFixed(1)}% from top of screen`);
  console.log(`  Car Height      : ${carScreenHeightPct.toFixed(1)}% of viewport height`);
  console.log(`  Unused Space    : ${emptyBottomPct.toFixed(1)}% at bottom of screen`);
});
