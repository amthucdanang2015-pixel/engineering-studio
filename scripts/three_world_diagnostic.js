import fs from "fs";
import path from "path";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Node.js canvas shim if needed or parse GLTF with GLTFLoader
const glbPath = path.resolve("./public/models/ESF_V2_Classic_Sports_Car_Demo_ThreeJS_YUp.glb");
const buffer = fs.readFileSync(glbPath);

// Create GLTFLoader instance
const loader = new GLTFLoader();

// Load GLTF from buffer array
loader.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), "", (gltf) => {
  const model = gltf.scene;

  console.log("=================================================");
  console.log("THREE.JS ACTUAL WORLD-SPACE DIAGNOSTIC (RAW GLB UNTRANSFORMED)");
  console.log("=================================================");

  // 1. Force update world matrix hierarchy
  model.updateWorldMatrix(true, true);

  const importantNodes = [
    "Front_Bumper",
    "Body_Front_Fascia",
    "Hood",
    "Windshield",
    "Rear_Deck",
    "Rear_Spoiler_Blade",
    "Seat_Left_Base",
    "Seat_Right_Base",
    "Chassis_Frame",
    "Wheel_Front_Left",
    "Wheel_Front_Right",
    "Wheel_Rear_Left",
    "Wheel_Rear_Right",
    "Engine_Block",
  ];

  const nodeMap = new Map();

  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Calculate actual world bounding box using Three.js setFromObject
      const box = new THREE.Box3().setFromObject(child);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      nodeMap.set(child.name, {
        name: child.name,
        min: box.min,
        max: box.max,
        center: center,
        size: size,
      });
    }
  });

  importantNodes.forEach((name) => {
    const data = nodeMap.get(name);
    if (data) {
      console.log(`\nMesh [${data.name}]:`);
      console.log(`  World Min   : (${data.min.x.toFixed(3)}, ${data.min.y.toFixed(3)}, ${data.min.z.toFixed(3)})`);
      console.log(`  World Max   : (${data.max.x.toFixed(3)}, ${data.max.y.toFixed(3)}, ${data.max.z.toFixed(3)})`);
      console.log(`  World Center: (${data.center.x.toFixed(3)}, ${data.center.y.toFixed(3)}, ${data.center.z.toFixed(3)})`);
      console.log(`  World Size  : (${data.size.x.toFixed(3)}, ${data.size.y.toFixed(3)}, ${data.size.z.toFixed(3)})`);
    } else {
      console.log(`\nMesh [${name}] NOT FOUND`);
    }
  });

  console.log("\n=================================================");
  console.log("ACTUAL WORLD SPACE VEHICLE AXIS DETERMINATION");
  console.log("=================================================");

  const wWindshield = nodeMap.get("Windshield")?.center;
  const wChassis = nodeMap.get("Chassis_Frame")?.center;
  const wFL = nodeMap.get("Wheel_Front_Left")?.center;
  const wFR = nodeMap.get("Wheel_Front_Right")?.center;
  const wRL = nodeMap.get("Wheel_Rear_Left")?.center;
  const wRR = nodeMap.get("Wheel_Rear_Right")?.center;
  const wFront = nodeMap.get("Front_Bumper")?.center;
  const wRear = nodeMap.get("Rear_Deck")?.center;

  console.log("\nKey Component World Centers:");
  console.log(`  Windshield (Roof) : (${wWindshield?.x.toFixed(3)}, ${wWindshield?.y.toFixed(3)}, ${wWindshield?.z.toFixed(3)})`);
  console.log(`  Chassis (Floor)   : (${wChassis?.x.toFixed(3)}, ${wChassis?.y.toFixed(3)}, ${wChassis?.z.toFixed(3)})`);
  console.log(`  Wheel Front Left  : (${wFL?.x.toFixed(3)}, ${wFL?.y.toFixed(3)}, ${wFL?.z.toFixed(3)})`);
  console.log(`  Wheel Front Right : (${wFR?.x.toFixed(3)}, ${wFR?.y.toFixed(3)}, ${wFR?.z.toFixed(3)})`);
  console.log(`  Wheel Rear Left   : (${wRL?.x.toFixed(3)}, ${wRL?.y.toFixed(3)}, ${wRL?.z.toFixed(3)})`);
  console.log(`  Wheel Rear Right  : (${wRR?.x.toFixed(3)}, ${wRR?.y.toFixed(3)}, ${wRR?.z.toFixed(3)})`);
  console.log(`  Front Bumper      : (${wFront?.x.toFixed(3)}, ${wFront?.y.toFixed(3)}, ${wFront?.z.toFixed(3)})`);
  console.log(`  Rear Deck         : (${wRear?.x.toFixed(3)}, ${wRear?.y.toFixed(3)}, ${wRear?.z.toFixed(3)})`);

  // UP determination: vector from Chassis floor to Windshield roof
  if (wWindshield && wChassis) {
    const upVec = new THREE.Vector3().subVectors(wWindshield, wChassis);
    console.log(`\nVector Chassis -> Windshield (UP): (${upVec.x.toFixed(3)}, ${upVec.y.toFixed(3)}, ${upVec.z.toFixed(3)})`);
  }

  // FRONT determination: vector from Rear deck to Front bumper
  if (wFront && wRear) {
    const frontVec = new THREE.Vector3().subVectors(wFront, wRear);
    console.log(`Vector Rear -> Front (FRONT): (${frontVec.x.toFixed(3)}, ${frontVec.y.toFixed(3)}, ${frontVec.z.toFixed(3)})`);
  }

  // LEFT determination: vector from FR wheel to FL wheel
  if (wFL && wFR) {
    const leftVec = new THREE.Vector3().subVectors(wFL, wFR);
    console.log(`Vector RightWheel -> LeftWheel (LEFT): (${leftVec.x.toFixed(3)}, ${leftVec.y.toFixed(3)}, ${leftVec.z.toFixed(3)})`);
  }
}, (err) => {
  console.error("Error loading GLTF:", err);
});
