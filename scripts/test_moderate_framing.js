import * as THREE from "three";

// Loaded vehicle size: 4.20m (L) x 1.785m (H) x 2.037m (D)
const sizeY = 1.785;
const sizeX = 4.200;
const aspect = 1512 / 712; // 2.124
const fovRad = THREE.MathUtils.degToRad(32);

const heightFillTargets = [0.70, 0.65, 0.62, 0.58];

console.log("=== MODERATE CAMERA FRAMING COMPARISON ===");

heightFillTargets.forEach((targetH) => {
  const targetW = 0.70; // 70% width margin

  let frustumH = sizeY / targetH;
  let frustumW = frustumH * aspect;

  if (frustumW < sizeX / targetW) {
    frustumW = sizeX / targetW;
    frustumH = frustumW / aspect;
  }

  const dist = frustumH / (2 * Math.tan(fovRad / 2));

  console.log(`\nHeight Target = ${(targetH * 100).toFixed(0)}%:`);
  console.log(`  Camera Distance : ${dist.toFixed(2)}m`);
  console.log(`  Frustum Size    : ${frustumW.toFixed(2)}m (W) x ${frustumH.toFixed(2)}m (H)`);
  console.log(`  Vehicle Height  : ${(sizeY / frustumH * 100).toFixed(1)}% of viewport height`);
  console.log(`  Vehicle Width   : ${(sizeX / frustumW * 100).toFixed(1)}% of viewport width`);
});
