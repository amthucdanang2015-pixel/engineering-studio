import type * as THREE from "three";

export type PartCategory = "BODY" | "COCKPIT" | "POWER" | "CHASSIS" | "WHEELS";

export interface PartMaterialConfig {
  color: string;
  roughness: number;
  metalness: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  opacity: number;
  transparent: boolean;
  wireframe: boolean;
  emissive?: string;
  emissiveIntensity?: number;
}

export interface VehiclePartData {
  id: string;
  name: string;
  category: PartCategory;
  description: string;
  specs: Record<string, string>;
  meshName: string;
  defaultMaterial: PartMaterialConfig;
  accentColor?: string;
}

export interface HotspotCallout {
  id: string;
  partId: string;
  label: string;
  scientificName: string;
  detail: string;
  color: string;
  position: [number, number, number];
}

export type ViewPreset = "isometric" | "front" | "side" | "top" | "engine" | "interior" | "wheels";
