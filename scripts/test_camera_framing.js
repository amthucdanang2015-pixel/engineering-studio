import * as THREE from "three";

// Vehicle dimensions in presentation space:
// Width (length along X): 4.60m (-2.30 to +2.30)
// Height (along Y): 1.85m (Y = -0.68 to +1.17)
// Center Y: 0.245m

const vehHeight = 1.85;
const vehLength = 4.60;
const centerY = 0.25;

const fov = 32; // degrees
const fovRad = THREE.MathUtils.degToRad(fov);

const testAspects = [
  { name: "Desktop Wide (1512x712)", aspect: 1512 / 712 },
  { name: "Desktop 16:9 (1920x1080)", aspect: 1920 / 1080 },
  { name: "Tablet Portrait (768x1024)", aspect: 768 / 1024 },
  { name: "Mobile Portrait (390x844)", aspect: 390 / 844 },
];

console.log("=== CAMERA FRAMING COMPUTATION ===");

testAspects.forEach(({ name, aspect }) => {
  // Desired vertical height framing: vehicle height = 65% of frustum height
  let targetH = vehHeight / 0.65; // ~2.846m
  let dist = targetH / (2 * Math.tan(fovRad / 2));

  // Check horizontal width framing: vehicle length must fit within 85% of frustum width
  let frustumW = targetH * aspect;
  if (frustumW < vehLength / 0.82) {
    frustumW = vehLength / 0.82;
    targetH = frustumW / aspect;
    dist = targetH / (2 * Math.tan(fovRad / 2));
  }

  const heightPct = (vehHeight / targetH) * 100;
  const widthPct = (vehLength / frustumW) * 100;

  console.log(`\n${name}:`);
  console.log(`  Camera Dist : ${dist.toFixed(2)}m`);
  console.log(`  Target Pos  : (0.00, ${centerY.toFixed(2)}, 0.00)`);
  console.log(`  Frustum     : ${frustumW.toFixed(2)}m x ${targetH.toFixed(2)}m`);
  console.log(`  Vehicle H % : ${heightPct.toFixed(1)}% of viewport height`);
  console.log(`  Vehicle W % : ${widthPct.toFixed(1)}% of viewport width`);
});
