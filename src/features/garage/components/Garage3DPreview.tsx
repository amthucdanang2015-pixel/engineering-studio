"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnatomyViewer } from "@/viewer/AnatomyViewer";
import { Box } from "lucide-react";

interface Garage3DPreviewProps {
  modelPath: string;
  vehicleName: string;
}

export const Garage3DPreview: React.FC<Garage3DPreviewProps> = ({ modelPath, vehicleName }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<AnatomyViewer | null>(null);

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

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

    viewer.setVehicleModel(modelPath).catch(() => {
      setLoading(false);
      setProgress(0);
    });

    return () => {
      viewerRef.current = null;
      viewer.dispose();
    };
  }, [modelPath]);

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
