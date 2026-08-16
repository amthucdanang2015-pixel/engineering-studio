"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Gauge,
  Zap,
  Car,
  Sparkles,
  Box,
  RotateCcw,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { getSavedVehicleBuilds, type SavedVehicleBuild } from "@/core/state/savedBuilds";
import { getVehicleCatalogItem, VEHICLE_CATALOG } from "@/core/domain/vehicleCatalog";
import {
  VehicleTestSimulator,
  type LiveTelemetry,
  type SimulationStage,
} from "./VehicleTestSimulator";
import { TestHUD, type TestHUDHandle } from "./TestHUD";
import { TestResultsOverlay } from "./TestResultsOverlay";
import { calculateVehicleTelemetry } from "../utils/telemetryCalculator";

export const TestView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buildIdParam = searchParams.get("buildId");
  const vehicleParam = searchParams.get("vehicle");

  const [mounted, setMounted] = useState(false);
  const [savedBuilds, setSavedBuilds] = useState<SavedVehicleBuild[]>([]);
  const hudRef = useRef<TestHUDHandle>(null);

  useEffect(() => {
    setMounted(true);
    setSavedBuilds(getSavedVehicleBuilds());
  }, []);

  // Retrieve saved build and vehicle definition
  const activeBuild = useMemo(() => {
    if (!mounted) return null;
    if (buildIdParam) {
      const found = savedBuilds.find((b) => b.id === buildIdParam);
      if (found) return found;
    }
    if (vehicleParam) {
      const byVehicle = savedBuilds.find((b) => b.baseVehicleId === vehicleParam);
      if (byVehicle) return byVehicle;
    }
    return savedBuilds[0] || null;
  }, [mounted, buildIdParam, vehicleParam, savedBuilds]);

  const activeBaseVehicle = useMemo(() => {
    const targetVehicleId = vehicleParam || activeBuild?.baseVehicleId || VEHICLE_CATALOG[0].id;
    return getVehicleCatalogItem(targetVehicleId);
  }, [vehicleParam, activeBuild]);

  // Derived telemetry metrics from build/vehicle specs
  const telemetryData = useMemo(() => {
    return calculateVehicleTelemetry(activeBaseVehicle, activeBuild);
  }, [activeBaseVehicle, activeBuild]);

  // Simulation state (only updated on major stage changes, never per-frame)
  const [simulationStage, setSimulationStage] = useState<SimulationStage>("LOADING");
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [replayCount, setReplayCount] = useState(0);

  // High-performance 60fps direct DOM update via hudRef — zero React re-render overhead
  const handleTelemetryUpdate = useCallback((data: LiveTelemetry) => {
    hudRef.current?.update(data);
  }, []);

  const handleStageChange = useCallback((stage: SimulationStage) => {
    setSimulationStage(stage);
  }, []);

  const handleLoadingProgress = useCallback((isLoading: boolean, progress: number) => {
    setLoading(isLoading);
    setLoadingProgress(progress);
  }, []);

  const handleReplay = useCallback(() => {
    setReplayCount((prev) => prev + 1);
  }, []);

  const displayBuildId = mounted ? (activeBuild?.id || activeBaseVehicle.id) : activeBaseVehicle.id;
  const buildTitle = mounted && activeBuild?.name
    ? activeBuild.name
    : `${activeBaseVehicle.name} Performance Specimen`;
  const customPartsCount = mounted && activeBuild
    ? Object.keys(activeBuild.materialOverrides || {}).length
    : 0;

  return (
    <div className="relative min-h-screen lg:h-[100dvh] lg:max-h-[100dvh] w-full bg-[#f4f6f9] text-slate-900 font-sans flex flex-col justify-between p-4 md:p-5 overflow-y-auto lg:overflow-hidden">
      {/* ── TOP NAVIGATION BAR ────────────────────────────────────── */}
      <Navbar />

      {/* ── MAIN WORKSPACE CONTENT ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 gap-3 sm:gap-4 overflow-visible lg:overflow-hidden">
        {/* Active Test Build Header Card */}
        <div className="bg-white rounded-2xl border border-[#e8e2d5] shadow-xs px-4 sm:px-6 py-3.5 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white shrink-0 shadow-xs">
              <Zap size={18} className="text-[#f95738]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#f95738] bg-[#f95738]/10 px-2 py-0.5 rounded-md border border-[#f95738]/20 font-mono">
                  ACTIVE TEST SPECIMEN
                </span>
                <span className="text-[10px] text-stone-400 font-mono">ID: {displayBuildId}</span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-stone-900 truncate">
                {buildTitle}
              </h2>
              <p className="text-[10px] text-stone-500 font-mono truncate">
                Base: {activeBaseVehicle.name} · {customPartsCount} custom parts · {activeBaseVehicle.specs.power} · {telemetryData.zeroTo100Formatted} 0-100
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={handleReplay}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-stone-700 font-extrabold text-xs uppercase tracking-wider transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Restart Test Animation"
            >
              <RotateCcw size={13} className="text-[#f95738]" />
              <span>Replay</span>
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  activeBuild
                    ? `/build?vehicle=${activeBaseVehicle.id}&buildId=${activeBuild.id}`
                    : `/build?vehicle=${activeBaseVehicle.id}`
                )
              }
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Car size={13} className="text-[#f95738]" />
              <span>Edit Build</span>
            </button>
          </div>
        </div>

        {/* ── 3D VEHICLE TEST SIMULATOR STAGE ──────────────────────── */}
        <div className="flex-1 w-full min-h-[380px] sm:min-h-[460px] relative rounded-3xl overflow-hidden border border-[#e8e2d5] bg-[#e8ecf1] shadow-sm flex flex-col">
          {/* Three.js Proving Grounds Animation Stage */}
          <VehicleTestSimulator
            vehicle={activeBaseVehicle}
            build={activeBuild}
            telemetryData={telemetryData}
            onTelemetryUpdate={handleTelemetryUpdate}
            onStageChange={handleStageChange}
            onLoadingProgress={handleLoadingProgress}
            replayTrigger={replayCount}
          />

          {/* Live Digital Cluster HUD (Driven by hudRef direct DOM updates) */}
          <TestHUD
            ref={hudRef}
            vehicleName={buildTitle}
            zeroTo100TargetSec={telemetryData.zeroTo100Time}
            isVisible={true}
          />

          {/* Results Summary Overlay at Hero / Finish State */}
          <TestResultsOverlay
            isOpen={simulationStage === "HERO"}
            vehicle={activeBaseVehicle}
            build={activeBuild}
            telemetry={telemetryData}
            onReplay={handleReplay}
          />

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#f7f4ed]/95 backdrop-blur-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e0564d]/10 text-[#e0564d] border border-[#e0564d]/20 mb-4 shadow-xs">
                <Box size={28} className="animate-pulse" />
              </div>
              <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider">
                Preparing Test Proving Grounds · {activeBaseVehicle.name}
              </h2>
              <div className="mt-3 w-48 h-1 bg-[#e8e2d5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#e0564d] rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(10, Math.round(loadingProgress * 100))}%` }}
                />
              </div>
              <p className="text-xs text-stone-400 mt-2 font-mono">
                {Math.max(10, Math.round(loadingProgress * 100))}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
