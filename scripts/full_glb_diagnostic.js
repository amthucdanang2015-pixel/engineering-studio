import fs from "fs";
import path from "path";

// Read public/models/ESF_V2_Classic_Sports_Car_Demo_ThreeJS_YUp.glb
const glbPath = path.resolve("./public/models/ESF_V2_Classic_Sports_Car_Demo_ThreeJS_YUp.glb");
const buffer = fs.readFileSync(glbPath);

const jsonLength = buffer.readUInt32LE(12);
const jsonChunk = buffer.toString("utf8", 20, 20 + jsonLength);
const gltf = JSON.parse(jsonChunk);

// Extract accessor min/max for specific named meshes
const nodeMeshMap = new Map();
gltf.nodes.forEach((node) => {
  if (node.mesh !== undefined) {
    const mesh = gltf.meshes[node.mesh];
    const posAccIndex = mesh.primitives[0].attributes.POSITION;
    const acc = gltf.accessors[posAccIndex];
    nodeMeshMap.set(node.name, { min: acc.min, max: acc.max });
  }
});

console.log("=================================================");
console.log("GLB RAW COORDINATE SYSTEM ANALYSIS");
console.log("=================================================");

const keyNodes = [
  "Front_Bumper",
  "LED_Headlight_Left",
  "LED_Headlight_Right",
  "Exhaust_Left",
  "Exhaust_Right",
  "Rear_Deck",
  "Windshield",
  "Seat_Left_Base",
  "Seat_Right_Base",
  "Chassis_Frame",
  "Wheel_Front_Left",
  "Wheel_Front_Right",
  "Wheel_Rear_Left",
  "Wheel_Rear_Right",
];

keyNodes.forEach((name) => {
  const bounds = nodeMeshMap.get(name);
  if (bounds) {
    const center = [
      ((bounds.min[0] + bounds.max[0]) / 2).toFixed(3),
      ((bounds.min[1] + bounds.max[1]) / 2).toFixed(3),
      ((bounds.min[2] + bounds.max[2]) / 2).toFixed(3),
    ];
    console.log(`Node [${name.padEnd(20)}]: center=(${center[0]}, ${center[1]}, ${center[2]}), min=(${bounds.min.map(v => v.toFixed(2))}), max=(${bounds.max.map(v => v.toFixed(2))})`);
  }
});
