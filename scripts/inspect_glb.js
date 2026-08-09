import fs from "fs";
import path from "path";

// Read public/models/ESF_V2_Classic_Sports_Car_Demo_ThreeJS_YUp.glb
const glbPath = path.resolve("./public/models/ESF_V2_Classic_Sports_Car_Demo_ThreeJS_YUp.glb");
const buffer = fs.readFileSync(glbPath);

// GLB header: magic (4), version (4), length (4), chunkLength (4), chunkType (4)
const jsonLength = buffer.readUInt32LE(12);
const jsonChunk = buffer.toString("utf8", 20, 20 + jsonLength);
const gltf = JSON.parse(jsonChunk);

console.log("=== GLTF SCENES ===");
console.log(JSON.stringify(gltf.scenes, null, 2));

console.log("\n=== GLTF NODES ===");
gltf.nodes.forEach((node, index) => {
  console.log(`Node [${index}]: name="${node.name}", mesh=${node.mesh}, children=${JSON.stringify(node.children)}, translation=${JSON.stringify(node.translation)}, rotation=${JSON.stringify(node.rotation)}, scale=${JSON.stringify(node.scale)}`);
});

console.log("\n=== GLTF MESHES ===");
gltf.meshes.forEach((mesh, index) => {
  console.log(`Mesh [${index}]: name="${mesh.name}", primitives=${mesh.primitives.length}`);
});
