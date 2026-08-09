"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Gauge, Wind, Activity, Zap, Car, ArrowRight } from "lucide-react";
import { TopNav } from "@/components/TopNav";

export const TestView: React.FC = () => {
  const router = useRouter();

  return (
    <div className="relative min-h-screen w-full bg-[#f4f6f9] text-slate-900 font-sans flex flex-col justify-between p-4 md:p-6 overflow-y-auto">
      {/* Top Header Navigation */}
      <header className="esf-panel w-full flex items-center justify-between rounded-2xl px-5 py-3.5 shadow-sm bg-white/90 backdrop-blur-md border border-slate-200 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f95738]/10 text-[#f95738] border border-[#f95738]/20">
            <Gauge size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">ESF V2</span>
              <span className="text-slate-300">/</span>
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900 uppercase">TEST SIMULATION</h1>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Vehicle performance testing and aerodynamic simulation area.
            </p>
          </div>
        </div>

        {/* Top Navigation */}
        <TopNav />
      </header>

      {/* Main Workspace Content */}
      <div className="flex-1 flex flex-col justify-center items-center my-6">
        <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f95738]/10 text-[#f95738] border border-[#f95738]/20 mb-4 shadow-sm">
            <Gauge size={32} />
          </div>

          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f95738] bg-[#f95738]/10 px-3 py-1 rounded-md border border-[#f95738]/20 block w-fit mx-auto mb-3">
            Testing &amp; Simulation Environment
          </span>

          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
            Vehicle Simulation Suite
          </h2>

          <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed mb-8">
            The vehicle testing and dynamics environment allows evaluating aerodynamic drag, cornering telemetry, and powertrain output curves across customized builds.
          </p>

          {/* Test modules grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative overflow-hidden">
              <div className="flex items-center gap-2 text-slate-700 font-extrabold text-sm mb-1.5">
                <Wind size={18} className="text-[#f95738]" />
                <span>Aerodynamic Tunnel</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Simulate drag coefficient (Cd) and axle downforce across velocity vectors.
              </p>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-mono">
                Coming Soon
              </span>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative overflow-hidden">
              <div className="flex items-center gap-2 text-slate-700 font-extrabold text-sm mb-1.5">
                <Activity size={18} className="text-[#f95738]" />
                <span>Track Telemetry</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Test 0-100 km/h acceleration curves, braking distance, and lateral G-force.
              </p>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-mono">
                Coming Soon
              </span>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative overflow-hidden">
              <div className="flex items-center gap-2 text-slate-700 font-extrabold text-sm mb-1.5">
                <Zap size={18} className="text-[#f95738]" />
                <span>Powertrain Dyno</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Analyze torque curves, thermal dissipation, and battery pack output efficiency.
              </p>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-mono">
                Coming Soon
              </span>
            </div>
          </div>

          {/* Quick Action Button */}
          <button
            type="button"
            onClick={() => router.push("/build")}
            className="inline-flex items-center gap-2 py-3.5 px-6 rounded-2xl bg-[#f95738] hover:bg-[#e0482b] text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-md active:scale-[0.98] group"
          >
            <Car size={16} />
            <span>Customize Vehicles in Build</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
