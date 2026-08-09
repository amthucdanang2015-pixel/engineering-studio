import fs from "fs";
import path from "path";

const glbPath = path.resolve("./public/models/ESF_V2_Classic_Sports_Car_Demo_ThreeJS_YUp.glb");
const buffer = fs.readFileSync(glbPath);

const jsonLength = buffer.readUInt32LE(12);
const jsonChunk = buffer.toString("utf8", 20, 20 + jsonLength);
const gltf = JSON.parse(jsonChunk);

console.log("=== ACCESSORS MIN/MAX ===");
gltf.accessors.forEach((acc, i) => {
  if (acc.min || acc.max) {
    console.log(`Accessor [${i}]: type=${acc.type}, min=${JSON.stringify(acc.min)}, max=${JSON.stringify(acc.max)}`);
  }
});
