"use client";

import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { Activity, Sparkles, Timer, Zap, CheckCircle2 } from "lucide-react";
import type { LiveTelemetry, SimulationStage } from "./VehicleTestSimulator";

export interface TestHUDHandle {
  update: (data: LiveTelemetry) => void;
}

interface TestHUDProps {
  vehicleName: string;
  zeroTo100TargetSec: number;
  isVisible?: boolean;
}

const STAGE_CONFIG: Record<SimulationStage, { label: string; className: string }> = {
  LOADING: {
    label: "INITIALIZING ENVIRONMENT",
    className: "bg-stone-900/90 text-stone-200 border-stone-700/60",
  },
  READY: {
    label: "SYSTEM READY · PRE-LAUNCH",
    className: "bg-amber-500/90 text-stone-950 font-black border-amber-400 animate-pulse",
  },
  LAUNCH: {
    label: "MAXIMUM LAUNCH",
    className: "bg-[#e0564d] text-white font-black border-[#e0564d] animate-pulse",
  },
  ACCELERATING: {
    label: "0–100 KM/H ACCELERATION SPRINT",
    className: "bg-[#f95738] text-white font-black border-[#f95738]",
  },
  TARGET_SPEED: {
    label: "0–100 KM/H MILESTONE REACHED",
    className: "bg-emerald-600 text-white font-black border-emerald-500",
  },
  DECELERATING: {
    label: "BRAKING & TELEMETRY LOG",
    className: "bg-cyan-700 text-white font-black border-cyan-500",
  },
  HERO: {
    label: "PERFORMANCE TEST COMPLETE",
    className: "bg-emerald-600 text-white font-black border-emerald-500 shadow-md",
  },
};

function formatTimerString(seconds: number): string {
  if (seconds <= 0) return "00:00.00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
}

export const TestHUD = forwardRef<TestHUDHandle, TestHUDProps>(({
  vehicleName,
  zeroTo100TargetSec,
  isVisible = true,
}, ref) => {
  // Direct DOM references for 60fps zero-render updates
  const containerRef = useRef<HTMLDivElement>(null);
  const speedElRef = useRef<HTMLSpanElement>(null);
  const gearElRef = useRef<HTMLSpanElement>(null);
  const rpmTextElRef = useRef<HTMLSpanElement>(null);
  const rpmBarElRef = useRef<HTMLDivElement>(null);
  const gForceElRef = useRef<HTMLDivElement>(null);
  const distanceElRef = useRef<HTMLDivElement>(null);
  const timerElRef = useRef<HTMLSpanElement>(null);
  const stagePillElRef = useRef<HTMLDivElement>(null);
  const stageTextElRef = useRef<HTMLSpanElement>(null);
  const milestoneElRef = useRef<HTMLDivElement>(null);
  const milestoneTextRef = useRef<HTMLSpanElement>(null);

  const prevStageRef = useRef<SimulationStage>("LOADING");

  useImperativeHandle(ref, () => ({
    update: (data: LiveTelemetry) => {
      // 1. Speed & Gear
      if (speedElRef.current) speedElRef.current.textContent = String(data.speedKmH);
      if (gearElRef.current) {
        gearElRef.current.textContent = data.gear > 0 ? `GEAR ${data.gear}` : "PARK";
      }

      // 2. RPM Text & Bar
      if (rpmTextElRef.current) rpmTextElRef.current.textContent = `RPM: ${data.rpm}`;
      if (rpmBarElRef.current) {
        const rpmPercent = Math.min(100, Math.max(0, (data.rpm / 7500) * 100));
        rpmBarElRef.current.style.width = `${rpmPercent}%`;
        rpmBarElRef.current.style.backgroundColor =
          rpmPercent > 85 ? "#e0564d" : rpmPercent > 65 ? "#f95738" : "#22c55e";
      }

      // 3. G-Force
      if (gForceElRef.current) {
        const sign = data.gForce >= 0 ? "+" : "";
        gForceElRef.current.innerHTML = `${sign}${data.gForce.toFixed(2)} <span class="text-xs text-stone-400 font-sans font-bold">G</span>`;
      }

      // 4. Distance
      if (distanceElRef.current) {
        distanceElRef.current.innerHTML = `${data.distanceMeters} <span class="text-[10px] text-stone-400 font-sans font-bold">M</span>`;
      }

      // 5. Timer
      if (timerElRef.current) {
        timerElRef.current.textContent = formatTimerString(data.elapsedTime);
      }

      // 6. Stage Pill
      if (prevStageRef.current !== data.stage) {
        prevStageRef.current = data.stage;
        const config = STAGE_CONFIG[data.stage] || STAGE_CONFIG.LOADING;
        if (stageTextElRef.current) stageTextElRef.current.textContent = config.label;
        if (stagePillElRef.current) {
          stagePillElRef.current.className = `inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-md border shadow-md transition-all duration-300 ${config.className}`;
        }
      }

      // 7. Milestone Pill
      if (milestoneElRef.current) {
        if (data.zeroTo100TimeReached !== null) {
          milestoneElRef.current.style.display = "flex";
          if (milestoneTextRef.current) {
            milestoneTextRef.current.textContent = `0–100: ${data.zeroTo100TimeReached.toFixed(1)}s VERIFIED`;
          }
        } else {
          milestoneElRef.current.style.display = "none";
        }
      }
    },
  }));

  return (
    <div
      ref={containerRef}
      style={{ display: isVisible ? "flex" : "none" }}
      className="absolute inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between z-10 select-none transition-opacity duration-300"
    >
      {/* ── TOP HEADER BAR: Stage Status & Target Telemetry ──────────────── */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: Stage Pill & Vehicle Title */}
        <div className="flex flex-col gap-2">
          <div
            ref={stagePillElRef}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-md border shadow-md transition-all duration-300 bg-amber-500 text-stone-950 border-amber-400 animate-pulse"
          >
            <span className="h-2 w-2 rounded-full bg-current animate-ping" />
            <span ref={stageTextElRef}>SYSTEM READY · PRE-LAUNCH</span>
          </div>

          <div className="bg-stone-950/90 backdrop-blur-md border border-white/20 text-white px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2">
            <Sparkles size={14} className="text-[#f95738]" />
            <span className="text-xs font-black uppercase tracking-wider text-white truncate max-w-[240px]">
              {vehicleName}
            </span>
          </div>
        </div>

        {/* Right: Live Timer & 0-100 Verified Milestone */}
        <div className="flex flex-col items-end gap-2">
          {/* High-Precision Timer */}
          <div className="bg-stone-950/90 backdrop-blur-md border border-white/20 text-white px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2.5 font-mono">
            <Timer size={15} className="text-[#f95738]" />
            <span className="text-xs font-black text-stone-300">TIME:</span>
            <span ref={timerElRef} className="text-sm font-black text-white">00:00.00</span>
          </div>

          {/* 0-100 Milestone Pill */}
          <div
            ref={milestoneElRef}
            style={{ display: "none" }}
            className="bg-emerald-600 text-white border border-emerald-400 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-[11px] font-black items-center gap-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-200"
          >
            <CheckCircle2 size={14} />
            <span ref={milestoneTextRef}>0–100: 2.8s VERIFIED</span>
          </div>
        </div>
      </div>

      {/* ── BOTTOM INSTRUMENT CLUSTER: Speedometer, Tachometer & G-Force ── */}
      <div className="flex items-end justify-between gap-4">
        {/* Left: G-Force & Track Distance */}
        <div className="bg-stone-950/90 backdrop-blur-md border border-white/20 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl flex flex-col gap-2 min-w-[130px] sm:min-w-[160px]">
          <div>
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-stone-300">
              <span>LATERAL / LONG G</span>
              <Activity size={13} className="text-[#f95738]" />
            </div>
            <div ref={gForceElRef} className="text-lg sm:text-xl font-black font-mono text-white mt-0.5">
              +0.00 <span className="text-xs text-stone-400 font-sans font-bold">G</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/15">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-stone-300">
              <span>DISTANCE</span>
            </div>
            <div ref={distanceElRef} className="text-xs sm:text-sm font-black font-mono text-stone-100 mt-0.5">
              0 <span className="text-[10px] text-stone-400 font-sans font-bold">M</span>
            </div>
          </div>
        </div>

        {/* Center: Main Digital Speedometer & Tachometer */}
        <div className="flex-1 max-w-sm bg-stone-950/90 backdrop-blur-md border border-white/20 text-white p-4 sm:p-5 rounded-3xl shadow-2xl flex flex-col items-center justify-center">
          {/* Main Digital Speed readout */}
          <div className="flex items-baseline gap-2 mb-1">
            <span ref={speedElRef} className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white drop-shadow-md">
              0
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-wider text-[#f95738] font-mono">KM/H</span>
              <span ref={gearElRef} className="text-[9px] font-black text-stone-300 font-mono">
                GEAR 1
              </span>
            </div>
          </div>

          {/* Dynamic Tachometer / RPM Bar */}
          <div className="w-full mt-1">
            <div className="flex items-center justify-between text-[9px] font-mono font-bold text-stone-300 mb-1">
              <span ref={rpmTextElRef}>RPM: 950</span>
              <span>7,500 MAX</span>
            </div>
            <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden p-0.5 border border-stone-700">
              <div
                ref={rpmBarElRef}
                className="h-full rounded-full transition-all duration-75"
                style={{ width: "12%", backgroundColor: "#22c55e" }}
              />
            </div>
          </div>
        </div>

        {/* Right: Powertrain & Telemetry specs */}
        <div className="hidden md:flex bg-stone-950/90 backdrop-blur-md border border-white/20 text-white p-4 rounded-2xl shadow-2xl flex-col gap-2 min-w-[150px]">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-stone-300">
            <span>TARGET 0-100</span>
            <Zap size={13} className="text-[#f95738]" />
          </div>
          <div className="text-lg font-black font-mono text-white">
            {zeroTo100TargetSec.toFixed(1)} <span className="text-xs text-stone-400 font-sans font-bold">s</span>
          </div>

          <div className="pt-2 border-t border-white/15 text-[10px] text-stone-300 font-mono font-bold">
            <span>PROVING GROUND · V2</span>
          </div>
        </div>
      </div>
    </div>
  );
});

TestHUD.displayName = "TestHUD";
