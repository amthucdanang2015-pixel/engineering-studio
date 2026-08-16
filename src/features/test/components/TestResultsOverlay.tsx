"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  ArrowRight,
  Wrench,
  CheckCircle2,
  Zap,
  Wind,
  Gauge,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import type { VehicleCatalogItem } from "@/core/domain/vehicleCatalog";
import type { SavedVehicleBuild } from "@/core/state/savedBuilds";
import type { VehicleTelemetryData } from "../utils/telemetryCalculator";

interface TestResultsOverlayProps {
  isOpen: boolean;
  vehicle: VehicleCatalogItem;
  build?: SavedVehicleBuild | null;
  telemetry: VehicleTelemetryData;
  onReplay: () => void;
}

export const TestResultsOverlay: React.FC<TestResultsOverlayProps> = ({
  isOpen,
  vehicle,
  build,
  telemetry,
  onReplay,
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  const buildName = build?.name || `${vehicle.name} Custom Build`;
  const customCount = Object.keys(build?.materialOverrides || {}).length;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-end p-4 sm:p-6 lg:p-8 pointer-events-none select-none">
      {/* Performance Summary Card */}
      <div className="pointer-events-auto w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl border border-[#e8e2d5] shadow-2xl p-6 sm:p-7 flex flex-col justify-between animate-in slide-in-from-right-4 zoom-in-95 duration-400">
        <div>
          {/* Header Badge */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-mono flex items-center gap-1.5">
              <CheckCircle2 size={12} />
              <span>PERFORMANCE TEST COMPLETE</span>
            </span>
            <span className="text-xs text-stone-400 font-mono">ID: {build?.id || vehicle.id}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mb-1">
            {buildName}
          </h2>
          <p className="text-xs text-stone-500 font-mono mb-5 flex items-center gap-1.5">
            <Sparkles size={12} className="text-[#f95738]" />
            <span>Base Model: {vehicle.name} · {customCount} custom parts configured</span>
          </p>

          {/* Telemetry Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-6">
            {/* 0-100 Time */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
              <div className="flex items-center gap-1.5 text-stone-400 mb-1">
                <Activity size={14} className="text-[#f95738]" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">0–100 KM/H</span>
              </div>
              <span className="text-lg font-black text-stone-900 font-mono">
                {telemetry.zeroTo100Formatted}
              </span>
            </div>

            {/* Powertrain Output */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
              <div className="flex items-center gap-1.5 text-stone-400 mb-1">
                <Zap size={14} className="text-[#f95738]" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">OUTPUT</span>
              </div>
              <span className="text-lg font-black text-stone-900 font-mono">
                {telemetry.powerFormatted}
              </span>
            </div>

            {/* Aerodynamic Drag */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
              <div className="flex items-center gap-1.5 text-stone-400 mb-1">
                <Wind size={14} className="text-[#f95738]" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">AERODYNAMIC</span>
              </div>
              <span className="text-lg font-black text-stone-900 font-mono">
                {telemetry.dragCoefficient} Cd
              </span>
            </div>

            {/* Peak G-Force */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
              <div className="flex items-center gap-1.5 text-stone-400 mb-1">
                <Gauge size={14} className="text-[#f95738]" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">PEAK LAUNCH</span>
              </div>
              <span className="text-lg font-black text-stone-900 font-mono">
                +{telemetry.peakGForce.toFixed(2)} G
              </span>
            </div>
          </div>

          {/* Vehicle Specifications details */}
          <div className="bg-stone-50/60 rounded-2xl p-3.5 border border-stone-200/60 mb-6 space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-600 font-mono text-[11px]">
              <span className="text-stone-400">Powertrain:</span>
              <span className="font-bold text-stone-800">{telemetry.engine}</span>
            </div>
            <div className="flex justify-between text-stone-600 font-mono text-[11px]">
              <span className="text-stone-400">Drivetrain:</span>
              <span className="font-bold text-stone-800">{telemetry.drivetrain}</span>
            </div>
            <div className="flex justify-between text-stone-600 font-mono text-[11px]">
              <span className="text-stone-400">Curb Weight:</span>
              <span className="font-bold text-stone-800">{telemetry.weightFormatted}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {/* Run Test Again CTA */}
          <button
            type="button"
            onClick={onReplay}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-[#e0564d] hover:bg-[#c9463e] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer"
          >
            <RotateCcw size={15} />
            <span>Run Test Again</span>
          </button>

          <div className="flex gap-2">
            {/* Back to Garage */}
            <button
              type="button"
              onClick={() => router.push(build ? `/garage?id=${build.id}` : "/garage")}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-extrabold text-xs uppercase tracking-wider transition-all shadow-2xs hover:border-stone-400 active:scale-[0.99] cursor-pointer"
            >
              <span>Back to Garage</span>
            </button>

            {/* Edit in Build */}
            <button
              type="button"
              onClick={() =>
                router.push(
                  build
                    ? `/build?vehicle=${vehicle.id}&buildId=${build.id}`
                    : `/build?vehicle=${vehicle.id}`
                )
              }
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-[0.99] cursor-pointer"
            >
              <Wrench size={13} className="text-[#f95738]" />
              <span>Edit Build</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
