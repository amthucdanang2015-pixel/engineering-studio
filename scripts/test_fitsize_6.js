import * as THREE from "three";

// Raw GLB vehicle dimensions:
// Length (bumper to bumper): 4.60m (-2.30 to +2.30)
// Height (wheels to roof): 1.86m (+0.20 to +2.06)

const rawLength = 4.60;
const rawHeight = 1.86;

const fitSizes = [4.2, 5.5, 6.5, 7.2];
const fov = 32;
const fovRad = THREE.MathUtils.degToRad(fov);
const aspect = 1512 / 712; // desktop viewport

console.log("=== FIT_SIZE SCALING EVALUATION ===");

fitSizes.forEach((fitSize) => {
  const modelScale = fitSize / rawLength;
  const scaledLength = rawLength * modelScale;
  const scaledHeight = rawHeight * modelScale;

  // Let's test camera distance = 4.2m
  const dist = 4.2;
  const frustumH = 2 * dist * Math.tan(fovRad / 2);
  const frustumW = frustumH * aspect;

  const heightPct = (scaledHeight / frustumH) * 100;
  const widthPct = (scaledLength / frustumW) * 100;

  console.log(`\nFIT_SIZE = ${fitSize}:`);
  console.log(`  Model Scale   : ${modelScale.toFixed(3)}x`);
  console.log(`  Scaled Size   : ${scaledLength.toFixed(2)}m (length) x ${scaledHeight.toFixed(2)}m (height)`);
  console.log(`  Frustum Size  : ${frustumW.toFixed(2)}m x ${frustumH.toFixed(2)}m`);
  console.log(`  Vehicle Height: ${heightPct.toFixed(1)}% of 3D viewport height`);
  console.log(`  Vehicle Width : ${widthPct.toFixed(1)}% of 3D viewport width`);
});
