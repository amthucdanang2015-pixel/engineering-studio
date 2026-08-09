import fs from "fs";
import path from "path";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const glbFiles = [
  "ESF_V2_Classic_Sports_Car_Demo_ThreeJS_YUp.glb",
  "ESF_V2_Classic_Sports_Car_Demo_ThreeJS_YUp1.glb",
  "ESF_V2_Rugged_Electric_Crossover_ThreeJS_YUp.glb",
];

const loader = new GLTFLoader();

console.log("=================================================");
console.log("INSPECTING ALL 3 GLB FILE BOUNDS & OBJECT TREES");
console.log("=================================================");

glbFiles.forEach((file) => {
  const filePath = path.resolve(`./public/models/${file}`);
  const buffer = fs.readFileSync(filePath);

  loader.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), "", (gltf) => {
    const model = gltf.scene;
    model.rotation.set(0, 0, 0);
    model.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    console.log(`\nFile: [${file}]`);
    console.log(`  Raw Box Min   : (${box.min.x.toFixed(3)}, ${box.min.y.toFixed(3)}, ${box.min.z.toFixed(3)})`);
    console.log(`  Raw Box Max   : (${box.max.x.toFixed(3)}, ${box.max.y.toFixed(3)}, ${box.max.z.toFixed(3)})`);
    console.log(`  Raw Box Center: (${center.x.toFixed(3)}, ${center.y.toFixed(3)}, ${center.z.toFixed(3)})`);
    console.log(`  Raw Box Size  : (${size.x.toFixed(3)}, ${size.y.toFixed(3)}, ${size.z.toFixed(3)})`);
  }, (err) => {
    console.error(`Error loading ${file}:`, err);
  });
});
