"use client";

import { useEffect, useRef } from "react";
import type { AnatomyViewer } from "@/viewer/AnatomyViewer";
import type { VehicleCustomization } from "@/core/domain/vehicleCustomization";
import type { VehicleCapabilities } from "@/core/domain/vehicleCapabilities";
import {
  GLASS_TINT_OPACITY,
  TRIM_FINISH_PBR,
  HEADLIGHT_STYLE_PBR,
  TAILLIGHT_STYLE_PBR,
} from "@/core/domain/vehicleCustomization";

/**
 * useGlbCustomization — the capability-driven customization adapter hook.
 *
 * Architecture:
 *   VehicleCustomization (domain state from Zustand)
 *     ↓  this hook
 *   VehicleCapabilities (GlbAnalyzer output — tells us which material names to target)
 *     ↓
 *   AnatomyViewer.updateMaterialByName() (Three.js layer)
 *
 * Key guarantee: this hook NEVER references a hard-coded material name.
 * All target material names come from `vehicleCapabilities` which was
 * derived from the actual loaded GLB.
 *
 * Performance: diffs against previous state — applies only changed properties.
 */
export function useGlbCustomization(
  viewerRef: React.RefObject<AnatomyViewer | null>,
  vehicleCapabilities: VehicleCapabilities,
  vehicleCustomization: VehicleCustomization,
  isLoading: boolean,
) {
  const prevCustomizationRef = useRef<VehicleCustomization | null>(null);

  useEffect(() => {
    if (isLoading) return;
    const viewer = viewerRef.current;
    if (!viewer) return;

    const prev = prevCustomizationRef.current;
    const caps = vehicleCapabilities;

    // ── PRIMARY PAINT ──────────────────────────────────────────────────────────
    if (caps.paint.supported) {
      const paint = vehicleCustomization.paint;
      const prevPaint = prev?.paint;
      const changed =
        !prevPaint ||
        paint.primary       !== prevPaint.primary       ||
        paint.metalness     !== prevPaint.metalness     ||
        paint.roughness     !== prevPaint.roughness     ||
        paint.clearcoat     !== prevPaint.clearcoat     ||
        paint.clearcoatRoughness !== prevPaint.clearcoatRoughness;

      if (changed) {
        const config = {
          color:             paint.primary,
          metalness:         paint.metalness         ?? 0.15,
          roughness:         paint.roughness         ?? 0.28,
          clearcoat:         paint.clearcoat,
          clearcoatRoughness: paint.clearcoatRoughness,
        };
        for (const matName of caps.paint.targetMaterialNames) {
          viewer.updateMaterialByName(matName, config);
        }
      }
    }

    // ── ACCENT PAINT ───────────────────────────────────────────────────────────
    if (caps.accentPaint.supported && vehicleCustomization.paint.secondary !== undefined) {
      const prevSecondary = prev?.paint?.secondary;
      if (vehicleCustomization.paint.secondary !== prevSecondary) {
        for (const matName of caps.accentPaint.targetMaterialNames) {
          viewer.updateMaterialByName(matName, {
            color:     vehicleCustomization.paint.secondary,
            metalness: vehicleCustomization.paint.metalness ?? 0.15,
            roughness: vehicleCustomization.paint.roughness ?? 0.28,
          });
        }
      }
    }

    // ── GLASS TINT ─────────────────────────────────────────────────────────────
    if (caps.glass.supported) {
      const tint = vehicleCustomization.glass?.tint;
      if (tint !== prev?.glass?.tint) {
        const opacity = tint ? (GLASS_TINT_OPACITY[tint] ?? 0.55) : 0.55;
        for (const matName of caps.glass.targetMaterialNames) {
          viewer.updateMaterialByName(matName, { opacity, transparent: true });
        }
      }
    }

    // ── RIM / WHEEL FINISH ─────────────────────────────────────────────────────
    if (caps.rims.supported) {
      const wheels = vehicleCustomization.wheels;
      const prevWheels = prev?.wheels;
      if (wheels && (
        wheels.rimColor      !== prevWheels?.rimColor      ||
        wheels.rimMetalness  !== prevWheels?.rimMetalness  ||
        wheels.rimRoughness  !== prevWheels?.rimRoughness
      )) {
        const rimConfig: Record<string, number | string | undefined> = {};
        if (wheels.rimColor     !== undefined) rimConfig.color     = wheels.rimColor;
        if (wheels.rimMetalness !== undefined) rimConfig.metalness = wheels.rimMetalness;
        if (wheels.rimRoughness !== undefined) rimConfig.roughness = wheels.rimRoughness;

        if (Object.keys(rimConfig).length > 0) {
          for (const matName of caps.rims.targetMaterialNames) {
            viewer.updateMaterialByName(matName, rimConfig);
          }
        }
      }
    }

    // ── TRIM FINISH ────────────────────────────────────────────────────────────
    if (caps.trim.supported) {
      const finish = vehicleCustomization.trim?.finish;
      if (finish && finish !== prev?.trim?.finish) {
        let trimPBR = TRIM_FINISH_PBR[finish];
        if (finish === "body-color") {
          trimPBR = { ...trimPBR, color: vehicleCustomization.paint.primary };
        }
        for (const matName of caps.trim.targetMaterialNames) {
          viewer.updateMaterialByName(matName, trimPBR);
        }
      }
    }

    // ── LIGHTS ─────────────────────────────────────────────────────────────────
    if (caps.lights.supported) {
      const headStyle = vehicleCustomization.lights?.headlightStyle;
      if (headStyle && headStyle !== prev?.lights?.headlightStyle) {
        const style = HEADLIGHT_STYLE_PBR[headStyle];
        for (const matName of caps.lights.targetMaterialNames) {
          viewer.updateMaterialByName(matName, {
            color:             style.color,
            emissive:          style.emissive,
            emissiveIntensity: style.emissiveIntensity,
          });
        }
      }
    }

    prevCustomizationRef.current = vehicleCustomization;
  }, [viewerRef, vehicleCapabilities, vehicleCustomization, isLoading]);
}
