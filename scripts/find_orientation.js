import fs from "fs";
import path from "path";

// Read public/models/ESF_V2_Classic_Sports_Car_Demo_ThreeJS_YUp.glb
const glbPath = path.resolve("./public/models/ESF_V2_Classic_Sports_Car_Demo_ThreeJS_YUp.glb");
const buffer = fs.readFileSync(glbPath);

const jsonLength = buffer.readUInt32LE(12);
const jsonChunk = buffer.toString("utf8", 20, 20 + jsonLength);
const gltf = JSON.parse(jsonChunk);

// Print node names and their accessor mins/maxes
console.log("=== NODE BOUNDS ===");
gltf.nodes.forEach((node, index) => {
  if (node.mesh !== undefined) {
    const mesh = gltf.meshes[node.mesh];
    const posAccIndex = mesh.primitives[0].attributes.POSITION;
    const acc = gltf.accessors[posAccIndex];
    console.log(`Node [${node.name}]: min=${JSON.stringify(acc.min)}, max=${JSON.stringify(acc.max)}`);
  }
});
