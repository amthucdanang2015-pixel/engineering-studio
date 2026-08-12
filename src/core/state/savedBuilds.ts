import type { PartMaterialConfig } from "../domain/vehicle";
import type { VehicleCustomization } from "../domain/vehicleCustomization";

export interface SavedVehicleBuild {
  id: string;
  baseVehicleId: string;
  name: string;
  savedAt: string;
  /** Legacy per-mesh material overrides — kept for backward compatibility */
  materialOverrides: Record<string, Partial<PartMaterialConfig>>;
  /** Semantic customization state — the primary save format going forward */
  vehicleCustomization?: VehicleCustomization;
}

const STORAGE_KEY = "esf_saved_builds";

export function getSavedVehicleBuilds(): SavedVehicleBuild[] {
  if (typeof window === "undefined") return [];
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error("Failed to read saved builds from localStorage", e);
    return [];
  }
}

export function saveVehicleBuild(build: SavedVehicleBuild): void {
  if (typeof window === "undefined") return;
  try {
    const current = getSavedVehicleBuilds();
    const existingIndex = current.findIndex((b) => b.id === build.id);
    if (existingIndex >= 0) {
      current[existingIndex] = build;
    } else {
      current.unshift(build);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error("Failed to save build to localStorage", e);
  }
}

export function deleteSavedVehicleBuild(id: string): SavedVehicleBuild[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getSavedVehicleBuilds();
    const filtered = current.filter((b) => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (e) {
    console.error("Failed to delete build from localStorage", e);
    return [];
  }
}
