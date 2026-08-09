"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnatomyViewer } from "@/viewer/AnatomyViewer";
import { Box } from "lucide-react";
import type { PartMaterialConfig } from "@/core/domain/vehicle";
import { VEHICLE_PARTS_DATA } from "@/core/state/useVehicleStore";

interface Garage3DPreviewProps {
  buildId: string;
  modelPath: string;
  vehicleName: string;
  materialOverrides?: Record<string, Partial<PartMaterialConfig>>;
}

export const Garage3DPreview: React.FC<Garage3DPreviewProps> = ({
  buildId,
  modelPath,
  vehicleName,
  materialOverrides,
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

  // ── 2. Sync vehicle model & material overrides on buildId / modelPath change ──
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

        // Reset all parts to default materials to ensure clean state
        VEHICLE_PARTS_DATA.forEach((part) => {
          viewer.updateMaterial(part.meshName, part.defaultMaterial);
        });

        // Apply target build's material overrides
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
  }, [buildId, modelPath, materialOverrides]);

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden bg-slate-900/5 border border-slate-200 esf-grid-bg">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="h-full w-full" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f95738]/10 text-[#f95738] border border-[#f95738]/20 animate-pulse mb-2">
            <Box size={20} />
          </div>
          <p className="text-xs font-bold text-slate-800">Loading {vehicleName}</p>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{Math.max(10, Math.round(progress * 100))}%</p>
        </div>
      )}
    </div>
  );
};
