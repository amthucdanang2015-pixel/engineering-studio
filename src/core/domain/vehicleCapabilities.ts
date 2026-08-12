/**
 * vehicleCapabilities.ts
 *
 * Types for the VehicleCapabilities report produced by GlbAnalyzer.
 * This is the contract between the analyzer (viewer layer) and the UI.
 * No Three.js types here — this must remain serializable for the Zustand store.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Material analysis — one entry per unique material in the GLB
// ─────────────────────────────────────────────────────────────────────────────

/** Which semantic vehicle part category a material belongs to */
export type SemanticClass =
  | "paint"
  | "glass"
  | "rim"
  | "tire"
  | "light"
  | "trim"
  | "interior"
  | "unknown";

export type ClassificationConfidence = "high" | "medium" | "low";

/** PBR properties sampled from the actual Three.js material instance */
export interface MaterialPBR {
  /** Linear RGB 0–1 */
  colorR: number;
  colorG: number;
  colorB: number;
  /** HSL derived values — used for classification heuristics */
  colorLightness: number;
  colorSaturation: number;
  colorHue: number;
  metalness: number;
  roughness: number;
  opacity: number;
  transparent: boolean;
  emissiveIntensity: number;
  /** Whether the material has a colour/albedo texture.
   *  When true, `material.color` acts as a tint multiplier over the texture. */
  hasColorMap: boolean;
  hasNormalMap: boolean;
  hasRoughnessMap: boolean;
  hasMetalnessMap: boolean;
}

/** Analysis result for one unique material (identified by name or fallback UUID key) */
export interface MaterialAnalysis {
  /** The GLB material name. Empty name materials get a generated key like __anon_ab12cd34 */
  materialName: string;
  /** Every mesh instance name that uses this material */
  meshNames: string[];
  /** Number of mesh instances */
  meshCount: number;
  pbr: MaterialPBR;
  semanticClass: SemanticClass;
  classificationConfidence: ClassificationConfidence;
  /** Whether it is safe and meaningful to expose customization for this material */
  isCustomizable: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Capability feature — one per semantic customization category
// ─────────────────────────────────────────────────────────────────────────────

export interface CapabilityFeature {
  supported: boolean;
  /** Material names to pass to updateMaterialByName() when this feature changes */
  targetMaterialNames: string[];
  /** Full analysis entries that contributed to this feature */
  materials: MaterialAnalysis[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Vehicle capabilities — the final report, stored in the Zustand store
// ─────────────────────────────────────────────────────────────────────────────

export interface VehicleCapabilities {
  /** Primary body paint */
  paint: CapabilityFeature;
  /** Secondary / accent paint (roof, splitter, etc.) — only when independent material */
  accentPaint: CapabilityFeature;
  /** Glass / window surfaces */
  glass: CapabilityFeature;
  /** Wheel rims / alloy faces */
  rims: CapabilityFeature;
  /** Exterior trim (chrome, gloss black, matte) */
  trim: CapabilityFeature;
  /** Light assemblies (heads + tails, or separate when possible) */
  lights: CapabilityFeature;
  /** Interior / cabin surfaces */
  interior: CapabilityFeature;

  /** Every material analyzed — useful for debug / Part Inspector tooltip */
  allMaterials: MaterialAnalysis[];
  /** Materials that couldn't be classified — NOT exposed in the UI */
  unclassified: MaterialAnalysis[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty / null capability helpers
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_FEATURE: CapabilityFeature = {
  supported: false,
  targetMaterialNames: [],
  materials: [],
};

export const EMPTY_VEHICLE_CAPABILITIES: VehicleCapabilities = {
  paint:       { ...EMPTY_FEATURE },
  accentPaint: { ...EMPTY_FEATURE },
  glass:       { ...EMPTY_FEATURE },
  rims:        { ...EMPTY_FEATURE },
  trim:        { ...EMPTY_FEATURE },
  lights:      { ...EMPTY_FEATURE },
  interior:    { ...EMPTY_FEATURE },
  allMaterials: [],
  unclassified: [],
};
