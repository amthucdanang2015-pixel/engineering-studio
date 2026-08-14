import * as THREE from "three";
import type {
  MaterialAnalysis,
  MaterialPBR,
  SemanticClass,
  ClassificationConfidence,
  CapabilityFeature,
  VehicleCapabilities,
} from "../core/domain/vehicleCapabilities";
import type { LoadedVehicleAsset } from "./AssetManager";

// ─────────────────────────────────────────────────────────────────────────────
// Classification keyword rules
// Applied in priority order — first match wins at HIGH confidence
// ─────────────────────────────────────────────────────────────────────────────

interface KeywordRule {
  pattern: RegExp;
  class: SemanticClass;
}

/**
 * Material name keywords → semantic class (HIGH confidence).
 * Rules are artist-defined semantics embedded in material names.
 * We never guess from these — if the artist named it "glass" it IS glass.
 */
const MATERIAL_NAME_RULES: KeywordRule[] = [
  { pattern: /paint|carpaint|body(?!_sg|_mat)|roof|roofshell|lacquer|basecoat|basecolor|colour|color(?:_\d)?$/i, class: "paint" },
  { pattern: /glass|window|windshield|visor|windows|glazing|windscreen/i,                          class: "glass" },
  { pattern: /rim|alloy|spoke|hub(?:cap)?|caliper|brake|wheel(?:detail)?/i,                       class: "rim" },
  { pattern: /tir[ey]|rubber(?:_\d)?$/i,                                                           class: "tire" },
  { pattern: /light|lamp|led|headlight|taillight|luminar|blinker|turn/i,                           class: "light" },
  { pattern: /chrome|trim|grille|bumper(?:_\d)?$|mirror|plastic(?:_\d)?$|pillar|accent/i,         class: "trim" },
  { pattern: /seat|interior|cabin|dash(?:board)?|steering|cockpit|console|carpet/i,                class: "interior" },
];

/**
 * Mesh name keywords → semantic class (LOW confidence).
 * Used only when the material name gives no signal.
 */
const MESH_NAME_RULES: KeywordRule[] = [
  { pattern: /body|shell|hood|door|fender|panel|roof|quarter|trunk|bonnet|fascia/i, class: "paint"    },
  { pattern: /glass|window|windshield|screen/i,                                      class: "glass"    },
  { pattern: /wheel|rim|hub/i,                                                        class: "rim"      },
  { pattern: /tire|tyre/i,                                                             class: "tire"     },
  { pattern: /light|lamp|headlight|taillight/i,                                       class: "light"    },
  { pattern: /seat|interior|dash|cabin/i,                                             class: "interior" },
];

// ─────────────────────────────────────────────────────────────────────────────
// PBR analysis helpers
// ─────────────────────────────────────────────────────────────────────────────

function samplePBR(material: THREE.MeshStandardMaterial): MaterialPBR {
  const hsl = { h: 0, s: 0, l: 0 };
  material.color.getHSL(hsl);

  return {
    colorR: material.color.r,
    colorG: material.color.g,
    colorB: material.color.b,
    colorHue:        hsl.h,
    colorSaturation: hsl.s,
    colorLightness:  hsl.l,
    metalness:           material.metalness ?? 0,
    roughness:           material.roughness ?? 0.5,
    opacity:             material.opacity   ?? 1,
    transparent:         material.transparent ?? false,
    emissiveIntensity:   material.emissiveIntensity ?? 0,
    hasColorMap:         !!material.map,
    hasNormalMap:        !!material.normalMap,
    hasRoughnessMap:     !!material.roughnessMap,
    hasMetalnessMap:     !!material.metalnessMap,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Classification
// ─────────────────────────────────────────────────────────────────────────────

function classifyMaterial(
  materialName: string,
  pbr: MaterialPBR,
  meshNames: string[],
): { semanticClass: SemanticClass; confidence: ClassificationConfidence } {

  // ── Step 1: Material name keyword match (HIGH confidence) ──────────────────
  for (const rule of MATERIAL_NAME_RULES) {
    if (rule.pattern.test(materialName)) {
      return { semanticClass: rule.class, confidence: "high" };
    }
  }

  // ── Step 2: PBR property heuristics (MEDIUM confidence) ────────────────────

  // Glass: transparent / semi-transparent AND not high-metalness (not a clearcoat)
  if ((pbr.transparent || pbr.opacity < 0.85) && pbr.metalness < 0.5) {
    return { semanticClass: "glass", confidence: "medium" };
  }

  // Tire: near-black, high roughness, low metalness
  if (pbr.colorLightness < 0.12 && pbr.roughness > 0.58 && pbr.metalness < 0.25) {
    return { semanticClass: "tire", confidence: "medium" };
  }

  // Chrome / rim: high metalness, low roughness, not near-black
  if (pbr.metalness > 0.78 && pbr.roughness < 0.35 && pbr.colorLightness > 0.1) {
    return { semanticClass: "rim", confidence: "medium" };
  }

  // Emissive or near-white with low roughness → light
  if (pbr.emissiveIntensity > 0.08 || (pbr.colorLightness > 0.78 && pbr.roughness < 0.3)) {
    return { semanticClass: "light", confidence: "medium" };
  }

  // Solid opaque with texture and moderate PBR → likely paint
  if (
    pbr.hasColorMap &&
    pbr.opacity >= 0.9 &&
    !pbr.transparent &&
    pbr.colorLightness > 0.04 &&
    pbr.colorLightness < 0.96
  ) {
    return { semanticClass: "paint", confidence: "medium" };
  }

  // Colored (some saturation), opaque → paint
  if (
    pbr.colorSaturation > 0.05 &&
    pbr.opacity >= 0.9 &&
    !pbr.transparent &&
    pbr.roughness < 0.7
  ) {
    return { semanticClass: "paint", confidence: "medium" };
  }

  // ── Step 3: Mesh name hints (LOW confidence) ───────────────────────────────
  const combinedMeshNames = meshNames.join(" ");
  for (const rule of MESH_NAME_RULES) {
    if (rule.pattern.test(combinedMeshNames)) {
      return { semanticClass: rule.class, confidence: "low" };
    }
  }

  return { semanticClass: "unknown", confidence: "low" };
}

/** Customizability rules — don't offer customization for things that aren't meaningful */
function isCustomizable(semanticClass: SemanticClass, confidence: ClassificationConfidence): boolean {
  // Tires are always black — exposing color would confuse users
  if (semanticClass === "tire") return false;
  // Unknown classification — don't expose
  if (semanticClass === "unknown") return false;
  // Interior low-confidence is risky (might be a shadow mesh or floor)
  if (semanticClass === "interior" && confidence === "low") return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature builder helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildFeature(analyses: MaterialAnalysis[]): CapabilityFeature {
  const customizable = analyses.filter((a) => a.isCustomizable);
  return {
    supported: customizable.length > 0,
    targetMaterialNames: customizable.map((a) => a.materialName),
    materials: customizable,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main analyzer
// ─────────────────────────────────────────────────────────────────────────────

export class GlbAnalyzer {
  /**
   * Analyze a loaded GLB asset and return its customization capabilities.
   *
   * Called ONCE per model load. Returns a plain-JSON-serializable report.
   * No Three.js objects in the return value.
   */
  static analyze(asset: LoadedVehicleAsset): VehicleCapabilities {
    // ── 1. Collect unique material instances ──────────────────────────────────
    // We iterate all mesh instances and map by material name.
    // For anonymous materials (name = ""), we generate a stable key by UUID prefix.
    const byKey = new Map<string, { mat: THREE.MeshStandardMaterial; meshNames: string[] }>();

    for (const mesh of asset.meshes) {
      const mats: THREE.Material[] = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];

      for (const m of mats) {
        if (!(m instanceof THREE.MeshStandardMaterial)) continue;
        const key = m.name || `__anon_${m.uuid.slice(0, 8)}`;
        const existing = byKey.get(key);
        if (existing) {
          existing.meshNames.push(mesh.name);
        } else {
          byKey.set(key, { mat: m, meshNames: [mesh.name] });
        }
      }
    }

    // ── 2. Analyze and classify each material ─────────────────────────────────
    const allMaterials: MaterialAnalysis[] = [];

    for (const [key, { mat, meshNames }] of byKey) {
      const pbr = samplePBR(mat);
      const { semanticClass, confidence } = classifyMaterial(key, pbr, meshNames);

      allMaterials.push({
        materialName: key,
        meshNames,
        meshCount: meshNames.length,
        pbr,
        semanticClass,
        classificationConfidence: confidence,
        isCustomizable: isCustomizable(semanticClass, confidence),
      });
    }

    console.groupCollapsed("[GlbAnalyzer] Material classification");
    for (const a of allMaterials) {
      console.log(
        `  [${a.classificationConfidence.toUpperCase()}] "${a.materialName}" → ${a.semanticClass}` +
          ` | ${a.meshCount} mesh(es) | customizable: ${a.isCustomizable}` +
          ` | PBR: metalness=${a.pbr.metalness.toFixed(2)} roughness=${a.pbr.roughness.toFixed(2)}` +
          ` opacity=${a.pbr.opacity.toFixed(2)} transparent=${a.pbr.transparent}`
      );
    }
    console.groupEnd();

    // ── 3. Group by semantic class ────────────────────────────────────────────
    const byClass = new Map<SemanticClass, MaterialAnalysis[]>();
    for (const a of allMaterials) {
      const list = byClass.get(a.semanticClass) ?? [];
      list.push(a);
      byClass.set(a.semanticClass, list);
    }

    const paintGroup  = byClass.get("paint")    ?? [];
    const glassGroup  = byClass.get("glass")    ?? [];
    const rimGroup    = byClass.get("rim")       ?? [];
    const lightGroup  = byClass.get("light")     ?? [];
    const trimGroup   = byClass.get("trim")      ?? [];
    const interiorGroup = byClass.get("interior") ?? [];
    const unknownGroup  = byClass.get("unknown")  ?? [];

    // ── 4. Split paint into primary / accent ──────────────────────────────────
    // If there are ≥2 distinct paint materials we expose an accent paint capability.
    // The first/largest paint group is primary; additional groups are accent.
    const sortedPaint = [...paintGroup].sort((a, b) => b.meshCount - a.meshCount);
    const primaryPaint = sortedPaint.slice(0, 1);
    const accentPaint  = sortedPaint.slice(1);

    const capabilities: VehicleCapabilities = {
      paint:       buildFeature(primaryPaint),
      accentPaint: buildFeature(accentPaint),
      glass:       buildFeature(glassGroup),
      rims:        buildFeature(rimGroup),
      trim:        buildFeature(trimGroup),
      lights:      buildFeature(lightGroup),
      interior:    buildFeature(interiorGroup),
      allMaterials,
      unclassified: unknownGroup,
    };

    console.log("[GlbAnalyzer] Capabilities:", {
      paint:       capabilities.paint.supported,
      accentPaint: capabilities.accentPaint.supported,
      glass:       capabilities.glass.supported,
      rims:        capabilities.rims.supported,
      trim:        capabilities.trim.supported,
      lights:      capabilities.lights.supported,
      interior:    capabilities.interior.supported,
      unclassified: capabilities.unclassified.length,
    });

    return capabilities;
  }
}
