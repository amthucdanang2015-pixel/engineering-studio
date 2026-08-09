import * as THREE from "three";

// Build camera and projection matrix for 1512x712 viewport
const camera = new THREE.PerspectiveCamera(32, 1512 / 712, 0.1, 100);

// Vehicle center point in world space
const carCenter = new THREE.Vector3(0, 0.20, 0);
const carRoof = new THREE.Vector3(0, 1.05, 0);
const carWheels = new THREE.Vector3(0, -0.65, 0);

function testProjection(camY, targetY, camZ) {
  camera.position.set(0, camY, camZ);
  camera.lookAt(0, targetY, 0);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();

  const pCenter = carCenter.clone().project(camera);
  const pRoof = carRoof.clone().project(camera);
  const pWheels = carWheels.clone().project(camera);

  // Convert NDC Y (-1 to +1) to screen Y % (0% = top, 100% = bottom)
  const screenCenterY = (1 - pCenter.y) / 2 * 100;
  const screenRoofY = (1 - pRoof.y) / 2 * 100;
  const screenWheelsY = (1 - pWheels.y) / 2 * 100;

  console.log(`\nCamera Pos Y=${camY.toFixed(2)}, Target Y=${targetY.toFixed(2)}, Dist Z=${camZ.toFixed(2)}:`);
  console.log(`  Car Center Screen Y : ${screenCenterY.toFixed(1)}% from top`);
  console.log(`  Car Roof Screen Y   : ${screenRoofY.toFixed(1)}% from top`);
  console.log(`  Car Wheels Screen Y : ${screenWheelsY.toFixed(1)}% from top`);
  console.log(`  Car Visual Height   : ${(screenWheelsY - screenRoofY).toFixed(1)}% of screen height`);
}

console.log("=== SCREEN PROJECTION TEST ===");
testProjection(0.65, 0.0, 4.5);   // Tilted camera (old)
testProjection(0.65, 0.25, 4.5);  // Slightly tilted camera
testProjection(0.20, 0.20, 4.5);  // Level horizontal camera (NEW PERFECT)
testProjection(0.15, 0.15, 3.8);  // Level horizontal camera closer
