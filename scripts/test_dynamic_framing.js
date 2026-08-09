import * as THREE from "three";

// Simulated vehicle bounding box sizes (size.x = length, size.y = height, size.z = depth)
const vehicles = [
  { name: "Classic Sports Car", size: new THREE.Vector3(4.20, 1.70, 1.83), center: new THREE.Vector3(0, 0.17, 0) },
  { name: "Classic Electric SUV", size: new THREE.Vector3(4.45, 1.85, 1.90), center: new THREE.Vector3(0, 0.22, 0) },
  { name: "Electric SUV 03", size: new THREE.Vector3(4.30, 1.80, 1.88), center: new THREE.Vector3(0, 0.20, 0) },
];

const fov = 32; // degrees
const fovRad = THREE.MathUtils.degToRad(fov);

const viewports = [
  { name: "Wide Desktop (1512x712)", aspect: 1512 / 712 },
  { name: "Standard 16:9 (1920x1080)", aspect: 1920 / 1080 },
  { name: "Tablet Portrait (768x1024)", aspect: 768 / 1024 },
  { name: "Mobile Portrait (390x844)", aspect: 390 / 844 },
];

console.log("=== DYNAMIC CAMERA BBOX FRAMING TEST ===");

vehicles.forEach((veh) => {
  console.log(`\n=================================================`);
  console.log(`VEHICLE: ${veh.name}`);
  console.log(`Size: ${veh.size.x.toFixed(2)}m (L) x ${veh.size.y.toFixed(2)}m (H) x ${veh.size.z.toFixed(2)}m (D)`);

  viewports.forEach((vp) => {
    let frustumH = veh.size.y / 0.70; // Target 70% height fill
    let frustumW = frustumH * vp.aspect;

    if (frustumW < veh.size.x / 0.80) {
      frustumW = veh.size.x / 0.80;
      frustumH = frustumW / vp.aspect;
    }

    const distance = frustumH / (2 * Math.tan(fovRad / 2));
    const hFill = (veh.size.y / frustumH) * 100;
    const wFill = (veh.size.x / frustumW) * 100;

    console.log(`  [${vp.name}]:`);
    console.log(`    Aspect Ratio : ${vp.aspect.toFixed(2)}`);
    console.log(`    Camera Dist  : ${distance.toFixed(2)}m`);
    console.log(`    Camera Target: (${veh.center.x.toFixed(2)}, ${veh.center.y.toFixed(2)}, ${veh.center.z.toFixed(2)})`);
    console.log(`    Height Fill  : ${hFill.toFixed(1)}% of viewport height`);
    console.log(`    Width Fill   : ${wFill.toFixed(1)}% of viewport width`);
  });
});
