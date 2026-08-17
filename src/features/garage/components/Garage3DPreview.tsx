"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnatomyViewer } from "@/viewer/AnatomyViewer";
import { Box } from "lucide-react";
import type { PartMaterialConfig } from "@/core/domain/vehicle";

import type { VehicleCustomization } from "@/core/domain/vehicleCustomization";
import {
  GLASS_TINT_OPACITY,
  TRIM_FINISH_PBR,
  HEADLIGHT_STYLE_PBR,
} from "@/core/domain/vehicleCustomization";

interface Garage3DPreviewProps {
  buildId: string;
  modelPath: string;
  vehicleName: string;
  materialOverrides?: Record<string, Partial<PartMaterialConfig>>;
  vehicleCustomization?: VehicleCustomization;
}

export const Garage3DPreview: React.FC<Garage3DPreviewProps> = ({
  buildId,
  modelPath,
  vehicleName,
  materialOverrides,
  vehicleCustomization,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<AnatomyViewer | null>(null);

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Active build ID ref to cancel stale async load callbacks
  const activeBuildIdRef = useRef<string>(buildId);
  activeBuildIdRef.current = buildId;

  // ── 1. Create AnatomyViewer once on mount ──────────
  useEffect(() => {
    if (!mountRef.current) return;

    const viewer = new AnatomyViewer(mountRef.current, {
      mode: "preview",
      onLoading: (isLoading, val) => {
        setLoading(isLoading);
        setProgress(val);
      },
    });

    viewerRef.current = viewer;
    viewer.setAutoRotate(true);

    return () => {
      viewerRef.current = null;
      viewer.dispose();
    };
  }, []);

  // ── 2. Sync vehicle model & customizations on buildId / modelPath / styles change ──
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const targetBuildId = buildId;
    setLoading(true);
    setProgress(0);

    viewer
      .setVehicleModel(modelPath)
      .then(() => {
        // Guard against race conditions: ignore if user selected another build while loading
        if (activeBuildIdRef.current !== targetBuildId) return;

        // Apply semantic vehicle customizations (paint, accent paint, glass, rims, trim, headlights)
        if (vehicleCustomization) {
          const caps = viewer.getCapabilities();
          if (caps) {
            // Primary Paint
            if (caps.paint.supported && vehicleCustomization.paint?.primary) {
              const paint = vehicleCustomization.paint;
              for (const matName of caps.paint.targetMaterialNames) {
                viewer.updateMaterialByName(matName, {
                  color: paint.primary,
                  metalness: paint.metalness ?? 0.15,
                  roughness: paint.roughness ?? 0.28,
                  clearcoat: paint.clearcoat,
                  clearcoatRoughness: paint.clearcoatRoughness,
                });
              }
            }

            // Accent Paint
            if (caps.accentPaint.supported && vehicleCustomization.paint?.secondary) {
              for (const matName of caps.accentPaint.targetMaterialNames) {
                viewer.updateMaterialByName(matName, {
                  color: vehicleCustomization.paint.secondary,
                  metalness: vehicleCustomization.paint.metalness ?? 0.15,
                  roughness: vehicleCustomization.paint.roughness ?? 0.28,
                });
              }
            }

            // Glass Tint
            if (caps.glass.supported && vehicleCustomization.glass?.tint) {
              const opacity = GLASS_TINT_OPACITY[vehicleCustomization.glass.tint] ?? 0.55;
              for (const matName of caps.glass.targetMaterialNames) {
                viewer.updateMaterialByName(matName, { opacity, transparent: true });
              }
            }

            // Wheels / Rims
            if (caps.rims.supported && vehicleCustomization.wheels?.rimColor) {
              for (const matName of caps.rims.targetMaterialNames) {
                viewer.updateMaterialByName(matName, {
                  color: vehicleCustomization.wheels.rimColor,
                  metalness: vehicleCustomization.wheels.rimMetalness,
                  roughness: vehicleCustomization.wheels.rimRoughness,
                });
              }
            }

            // Trim
            if (caps.trim.supported && vehicleCustomization.trim?.finish) {
              let trimPBR = TRIM_FINISH_PBR[vehicleCustomization.trim.finish];
              if (vehicleCustomization.trim.finish === "body-color") {
                trimPBR = { ...trimPBR, color: vehicleCustomization.paint.primary };
              }
              for (const matName of caps.trim.targetMaterialNames) {
                viewer.updateMaterialByName(matName, trimPBR);
              }
            }

            // Lights
            if (caps.lights.supported && vehicleCustomization.lights?.headlightStyle) {
              const style = HEADLIGHT_STYLE_PBR[vehicleCustomization.lights.headlightStyle];
              if (style) {
                for (const matName of caps.lights.targetMaterialNames) {
                  viewer.updateMaterialByName(matName, {
                    color: style.color,
                    emissive: style.emissive,
                    emissiveIntensity: style.emissiveIntensity,
                  });
                }
              }
            }
          }
        }

        // Apply target build's fine-grained per-mesh material overrides
        if (materialOverrides && Object.keys(materialOverrides).length > 0) {
          Object.entries(materialOverrides).forEach(([meshName, config]) => {
            viewer.updateMaterial(meshName, config);
          });
        }
        setLoading(false);
      })
      .catch(() => {
        if (activeBuildIdRef.current === targetBuildId) {
          setLoading(false);
          setProgress(0);
        }
      });
  }, [buildId, modelPath, materialOverrides, vehicleCustomization]);

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden bg-[#f8f5ee] border border-[#e8e2d5]">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="h-full w-full" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#f7f4ed]/90 backdrop-blur-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e0564d]/10 text-[#e0564d] border border-[#e0564d]/20 animate-pulse mb-2">
            <Box size={20} />
          </div>
          <p className="text-xs font-bold text-stone-800">Loading {vehicleName}</p>
          <p className="text-[10px] text-stone-500 font-mono mt-0.5">{Math.max(10, Math.round(progress * 100))}%</p>
        </div>
      )}
    </div>
  );
};
