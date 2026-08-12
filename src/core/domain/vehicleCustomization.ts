/**
 * VehicleCustomization — the serializable domain state for a vehicle configuration.
 *
 * This is intentionally free of Three.js types so it can be saved to localStorage,
 * diffed for "dirty" detection, and compared across sessions without any renderer coupling.
 *
 * The renderer translates this into GLB material changes via GlbCustomizationAdapter.
 */

export type GlassTint = "none" | "light" | "medium" | "dark";
export type TrimFinish = "chrome" | "gloss-black" | "matte-black" | "body-color";
export type HeadlightStyle = "standard" | "cool-white" | "warm-white";
export type TaillightStyle = "standard" | "dark" | "bright";

export interface VehicleCustomization {
  paint: {
    /** Primary body color — applied to all primary paint surfaces */
    primary: string;
    /** Optional accent/secondary paint — e.g. contrasting roof, splitter */
    secondary?: string;
    metalness?: number;
    roughness?: number;
    clearcoat?: number;
    clearcoatRoughness?: number;
  };
  wheels?: {
    /** Rim / alloy color */
    rimColor?: string;
    rimMetalness?: number;
    rimRoughness?: number;
  };
  glass?: {
    tint?: GlassTint;
  };
  trim?: {
    finish?: TrimFinish;
  };
  lights?: {
    headlightStyle?: HeadlightStyle;
    taillightStyle?: TaillightStyle;
  };
  /** Per-mesh fine-grained overrides — set by the Part Inspector click flow */
  meshOverrides?: Record<string, {
    color?: string;
    roughness?: number;
    metalness?: number;
    opacity?: number;
    wireframe?: boolean;
  }>;
}

export const DEFAULT_VEHICLE_CUSTOMIZATION: VehicleCustomization = {
  paint: {
    primary: "#1c3e7a",   // deep midnight blue — neutral automotive default
    metalness: 0.15,
    roughness: 0.28,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
  },
  wheels: {
    rimColor: undefined,    // undefined = use original GLB material
    rimMetalness: undefined,
    rimRoughness: undefined,
  },
  glass: {
    tint: "none",
  },
  trim: {
    finish: "chrome",
  },
  lights: {
    headlightStyle: "standard",
    taillightStyle: "standard",
  },
};

/** Glass tint opacity values */
export const GLASS_TINT_OPACITY: Record<GlassTint, number> = {
  none: 0.55,
  light: 0.45,
  medium: 0.3,
  dark: 0.15,
};

/** Trim finish PBR presets */
export const TRIM_FINISH_PBR: Record<TrimFinish, { color: string; metalness: number; roughness: number }> = {
  chrome:       { color: "#c8cdd4", metalness: 0.95, roughness: 0.08 },
  "gloss-black": { color: "#0a0a0a", metalness: 0.3,  roughness: 0.1  },
  "matte-black": { color: "#111111", metalness: 0.1,  roughness: 0.7  },
  "body-color":  { color: "#1c3e7a", metalness: 0.15, roughness: 0.28 }, // overridden dynamically
};

/** Headlight style PBR presets */
export const HEADLIGHT_STYLE_PBR: Record<HeadlightStyle, { color: string; emissive: string; emissiveIntensity: number }> = {
  standard:   { color: "#d0e8ff", emissive: "#c8e0ff", emissiveIntensity: 0.4 },
  "cool-white": { color: "#e8f4ff", emissive: "#b8d8ff", emissiveIntensity: 0.7 },
  "warm-white": { color: "#fff0d0", emissive: "#ffd890", emissiveIntensity: 0.6 },
};

/** Taillight style PBR presets */
export const TAILLIGHT_STYLE_PBR: Record<TaillightStyle, { color: string; emissive: string; emissiveIntensity: number }> = {
  standard: { color: "#cc0000", emissive: "#dd0000", emissiveIntensity: 0.5 },
  dark:     { color: "#440000", emissive: "#220000", emissiveIntensity: 0.2 },
  bright:   { color: "#ff2200", emissive: "#ff2200", emissiveIntensity: 0.9 },
};
