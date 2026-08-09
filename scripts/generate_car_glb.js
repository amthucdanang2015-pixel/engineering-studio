import fs from 'fs';
import path from 'path';

/**
 * Creates a valid binary glTF (GLB v2.0) file containing a structured 3D Sports Car
 * with named meshes, hierarchy, and PBR standard materials for mesh selection/inspector.
 */
function generateSportsCarGlb() {
  // --- Materials ---
  const materials = [
    {
      name: "Material_BodyPaint",
      pbrMetallicRoughness: {
        baseColorFactor: [0.84, 0.16, 0.16, 1.0], // Italian Red
        metallicFactor: 0.7,
        roughnessFactor: 0.25,
      },
    },
    {
      name: "Material_Chassis",
      pbrMetallicRoughness: {
        baseColorFactor: [0.12, 0.14, 0.13, 1.0],
        metallicFactor: 0.8,
        roughnessFactor: 0.5,
      },
    },
    {
      name: "Material_EngineBlock",
      pbrMetallicRoughness: {
        baseColorFactor: [0.8, 0.8, 0.8, 1.0],
        metallicFactor: 0.9,
        roughnessFactor: 0.3,
      },
    },
    {
      name: "Material_EngineCovers",
      pbrMetallicRoughness: {
        baseColorFactor: [0.72, 0.04, 0.3, 1.0],
        metallicFactor: 0.7,
        roughnessFactor: 0.3,
      },
    },
    {
      name: "Material_Glass",
      pbrMetallicRoughness: {
        baseColorFactor: [0.66, 0.85, 0.86, 0.4],
        metallicFactor: 0.1,
        roughnessFactor: 0.1,
      },
      alphaMode: "BLEND",
    },
    {
      name: "Material_TireRubber",
      pbrMetallicRoughness: {
        baseColorFactor: [0.07, 0.07, 0.07, 1.0],
        metallicFactor: 0.1,
        roughnessFactor: 0.85,
      },
    },
    {
      name: "Material_ChromeRim",
      pbrMetallicRoughness: {
        baseColorFactor: [0.95, 0.98, 0.93, 1.0],
        metallicFactor: 0.95,
        roughnessFactor: 0.15,
      },
    },
    {
      name: "Material_LeatherSeats",
      pbrMetallicRoughness: {
        baseColorFactor: [0.17, 0.18, 0.26, 1.0],
        metallicFactor: 0.1,
        roughnessFactor: 0.6,
      },
    },
    {
      name: "Material_InteriorDash",
      pbrMetallicRoughness: {
        baseColorFactor: [0.1, 0.1, 0.15, 1.0],
        metallicFactor: 0.3,
        roughnessFactor: 0.5,
      },
    },
    {
      name: "Material_CarbonFiber",
      pbrMetallicRoughness: {
        baseColorFactor: [0.08, 0.08, 0.1, 1.0],
        metallicFactor: 0.5,
        roughnessFactor: 0.3,
      },
    },
    {
      name: "Material_Headlights",
      pbrMetallicRoughness: {
        baseColorFactor: [0.88, 0.97, 0.98, 1.0],
        metallicFactor: 0.2,
        roughnessFactor: 0.1,
      },
      emissiveFactor: [0.5, 0.87, 0.92],
    },
  ];

  // Helper to build unit box geometry buffers (Positions & Normals)
  function buildBoxGeometry(sx, sy, sz) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const positions = new Float32Array([
      // Front
      -hx, -hy,  hz,   hx, -hy,  hz,   hx,  hy,  hz,  -hx,  hy,  hz,
      // Back
       hx, -hy, -hz,  -hx, -hy, -hz,  -hx,  hy, -hz,   hx,  hy, -hz,
      // Top
      -hx,  hy,  hz,   hx,  hy,  hz,   hx,  hy, -hz,  -hx,  hy, -hz,
      // Bottom
      -hx, -hy, -hz,   hx, -hy, -hz,   hx, -hy,  hz,  -hx, -hy,  hz,
      // Right
       hx, -hy,  hz,   hx, -hy, -hz,   hx,  hy, -hz,   hx,  hy,  hz,
      // Left
      -hx, -hy, -hz,  -hx, -hy,  hz,  -hx,  hy,  hz,  -hx,  hy, -hz
    ]);

    const normals = new Float32Array([
       0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,
       0, 0,-1,   0, 0,-1,   0, 0,-1,   0, 0,-1,
       0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,
       0,-1, 0,   0,-1, 0,   0,-1, 0,   0,-1, 0,
       1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,
      -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0
    ]);

    const indices = new Uint16Array([
      0, 1, 2,  0, 2, 3,
      4, 5, 6,  4, 6, 7,
      8, 9,10,  8,10,11,
     12,13,14, 12,14,15,
     16,17,18, 16,18,19,
     20,21,22, 20,22,23
    ]);

    return { positions, normals, indices };
  }

  // Define components
  const components = [
    { name: "Body_Shell", matIdx: 0, size: [1.9, 0.55, 3.9], pos: [0, 0.52, 0] },
    { name: "Body_NoseCone", matIdx: 0, size: [1.7, 0.35, 0.9], pos: [0, 0.42, 2.1] },
    { name: "Body_RoofCanopy", matIdx: 0, size: [1.4, 0.48, 1.5], pos: [0, 0.98, -0.1] },
    { name: "Fender_FL", matIdx: 0, size: [0.28, 0.48, 0.7], pos: [-0.92, 0.48, 1.35] },
    { name: "Fender_FR", matIdx: 0, size: [0.28, 0.48, 0.7], pos: [0.92, 0.48, 1.35] },
    { name: "Fender_RL", matIdx: 0, size: [0.28, 0.52, 0.7], pos: [-0.92, 0.52, -1.35] },
    { name: "Fender_RR", matIdx: 0, size: [0.28, 0.52, 0.7], pos: [0.92, 0.52, -1.35] },

    { name: "Chassis_Floorpan", matIdx: 1, size: [1.8, 0.12, 3.8], pos: [0, 0.25, 0] },
    { name: "Chassis_Rail_Left", matIdx: 1, size: [0.15, 0.15, 4.0], pos: [-0.75, 0.25, 0] },
    { name: "Chassis_Rail_Right", matIdx: 1, size: [0.15, 0.15, 4.0], pos: [0.75, 0.25, 0] },

    { name: "Wheel_FL_Tire", matIdx: 5, size: [0.3, 0.84, 0.84], pos: [-0.95, 0.42, 1.35] },
    { name: "Wheel_FL_Rim", matIdx: 6, size: [0.32, 0.6, 0.6], pos: [-0.95, 0.42, 1.35] },
    { name: "Wheel_FR_Tire", matIdx: 5, size: [0.3, 0.84, 0.84], pos: [0.95, 0.42, 1.35] },
    { name: "Wheel_FR_Rim", matIdx: 6, size: [0.32, 0.6, 0.6], pos: [0.95, 0.42, 1.35] },
    { name: "Wheel_RL_Tire", matIdx: 5, size: [0.34, 0.88, 0.88], pos: [-0.95, 0.44, -1.35] },
    { name: "Wheel_RL_Rim", matIdx: 6, size: [0.36, 0.64, 0.64], pos: [-0.95, 0.44, -1.35] },
    { name: "Wheel_RR_Tire", matIdx: 5, size: [0.34, 0.88, 0.88], pos: [0.95, 0.44, -1.35] },
    { name: "Wheel_RR_Rim", matIdx: 6, size: [0.36, 0.64, 0.64], pos: [0.95, 0.44, -1.35] },

    { name: "Engine_V8_Block", matIdx: 2, size: [0.7, 0.45, 0.8], pos: [0, 0.55, -0.85] },
    { name: "ValveCover_Left", matIdx: 3, size: [0.28, 0.18, 0.75], pos: [-0.25, 0.83, -0.85] },
    { name: "ValveCover_Right", matIdx: 3, size: [0.28, 0.18, 0.75], pos: [0.25, 0.83, -0.85] },

    { name: "Front_Windshield", matIdx: 4, size: [1.4, 0.55, 0.05], pos: [0, 0.95, 0.52] },
    { name: "Rear_Window", matIdx: 4, size: [1.3, 0.48, 0.05], pos: [0, 0.95, -0.72] },

    { name: "Seat_Driver", matIdx: 7, size: [0.55, 0.7, 0.55], pos: [-0.4, 0.65, 0.1] },
    { name: "Seat_Passenger", matIdx: 7, size: [0.55, 0.7, 0.55], pos: [0.4, 0.65, 0.1] },
    { name: "Dashboard_Console", matIdx: 8, size: [1.45, 0.25, 0.45], pos: [0, 0.78, 0.32] },

    { name: "Spoiler_Wing", matIdx: 9, size: [1.85, 0.06, 0.32], pos: [0, 1.1, -1.8] },
    { name: "Headlight_Left", matIdx: 10, size: [0.35, 0.12, 0.12], pos: [-0.65, 0.52, 2.05] },
    { name: "Headlight_Right", matIdx: 10, size: [0.35, 0.12, 0.12], pos: [0.65, 0.52, 2.05] }
  ];

  // Binary buffers aggregation
  const binBuffers = [];
  let currentByteOffset = 0;

  const accessors = [];
  const bufferViews = [];
  const meshes = [];
  const nodes = [];

  // Root container node
  nodes.push({
    name: "ESF_V2_Classic_Sports_Car",
    children: components.map((_, i) => i + 1),
  });

  components.forEach((comp, idx) => {
    const geo = buildBoxGeometry(...comp.size);
    
    // Positions BufferView
    const posByteOffset = currentByteOffset;
    const posByteLength = geo.positions.byteLength;
    binBuffers.push(Buffer.from(geo.positions.buffer));
    currentByteOffset += posByteLength;

    bufferViews.push({ buffer: 0, byteOffset: posByteOffset, byteLength: posByteLength, target: 34962 });
    const posAccessorIdx = accessors.length;
    accessors.push({
      bufferView: bufferViews.length - 1,
      byteOffset: 0,
      componentType: 5126, // FLOAT
      count: 24,
      type: "VEC3",
      max: [comp.size[0]/2, comp.size[1]/2, comp.size[2]/2],
      min: [-comp.size[0]/2, -comp.size[1]/2, -comp.size[2]/2],
    });

    // Normals BufferView
    const normByteOffset = currentByteOffset;
    const normByteLength = geo.normals.byteLength;
    binBuffers.push(Buffer.from(geo.normals.buffer));
    currentByteOffset += normByteLength;

    bufferViews.push({ buffer: 0, byteOffset: normByteOffset, byteLength: normByteLength, target: 34962 });
    const normAccessorIdx = accessors.length;
    accessors.push({
      bufferView: bufferViews.length - 1,
      byteOffset: 0,
      componentType: 5126, // FLOAT
      count: 24,
      type: "VEC3",
    });

    // Indices BufferView
    const indByteOffset = currentByteOffset;
    const indByteLength = geo.indices.byteLength;
    binBuffers.push(Buffer.from(geo.indices.buffer));
    currentByteOffset += indByteLength;

    // Pad buffer to 4 bytes alignment
    const padding = (4 - (currentByteOffset % 4)) % 4;
    if (padding > 0) {
      binBuffers.push(Buffer.alloc(padding));
      currentByteOffset += padding;
    }

    bufferViews.push({ buffer: 0, byteOffset: indByteOffset, byteLength: indByteLength, target: 34963 });
    const indAccessorIdx = accessors.length;
    accessors.push({
      bufferView: bufferViews.length - 1,
      byteOffset: 0,
      componentType: 5123, // UNSIGNED_SHORT
      count: 36,
      type: "SCALAR",
    });

    // Mesh
    const meshIdx = meshes.length;
    meshes.push({
      name: comp.name,
      primitives: [{
        attributes: {
          POSITION: posAccessorIdx,
          NORMAL: normAccessorIdx,
        },
        indices: indAccessorIdx,
        material: comp.matIdx,
      }],
    });

    // Node
    nodes.push({
      name: comp.name,
      mesh: meshIdx,
      translation: comp.pos,
    });
  });

  const binBufferCombined = Buffer.concat(binBuffers);

  const gltfJson = {
    asset: { version: "2.0", generator: "ESF_V2_Procedural_Exporter" },
    scene: 0,
    scenes: [{ name: "Default Scene", nodes: [0] }],
    nodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: binBufferCombined.length }],
  };

  const jsonStr = JSON.stringify(gltfJson);
  const jsonBuffer = Buffer.from(jsonStr, 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunkLen = jsonBuffer.length + jsonPadding;

  const totalLength = 12 + 8 + jsonChunkLen + 8 + binBufferCombined.length;
  const glbBuffer = Buffer.alloc(totalLength);

  // Header
  glbBuffer.writeUInt32LE(0x46544C67, 0); // Magic 'glTF'
  glbBuffer.writeUInt32LE(2, 4);          // Version 2
  glbBuffer.writeUInt32LE(totalLength, 8);

  // JSON Chunk Header
  glbBuffer.writeUInt32LE(jsonChunkLen, 12);
  glbBuffer.writeUInt32LE(0x4E4F534A, 16); // Chunk 'JSON'
  jsonBuffer.copy(glbBuffer, 20);
  for (let i = 0; i < jsonPadding; i++) {
    glbBuffer.writeUInt8(0x20, 20 + jsonBuffer.length + i);
  }

  // BIN Chunk Header
  const binHeaderOffset = 20 + jsonChunkLen;
  glbBuffer.writeUInt32LE(binBufferCombined.length, binHeaderOffset);
  glbBuffer.writeUInt32LE(0x004E4942, binHeaderOffset + 4); // Chunk 'BIN'
  binBufferCombined.copy(glbBuffer, binHeaderOffset + 8);

  const outputDir = path.resolve(process.cwd(), 'public/models');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'ESF_V2_Classic_Sports_Car_Demo.glb');
  fs.writeFileSync(outputPath, glbBuffer);
  console.log(`✅ Successfully generated ESF V2 Sports Car GLB model at: ${outputPath} (${(glbBuffer.length / 1024).toFixed(1)} KB)`);
}

generateSportsCarGlb();
