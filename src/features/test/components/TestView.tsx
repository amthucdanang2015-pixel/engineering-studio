"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Gauge, Wind, Activity, Zap, Car, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { getSavedVehicleBuilds } from "@/core/state/savedBuilds";
import { getVehicleCatalogItem } from "@/core/domain/vehicleCatalog";
import { Garage3DPreview } from "@/features/garage/components/Garage3DPreview";

export const TestView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buildIdParam = searchParams.get("buildId");

  const savedBuilds = getSavedVehicleBuilds();
  const activeBuild = buildIdParam ? savedBuilds.find((b) => b.id === buildIdParam) : null;
  const activeBaseVehicle = activeBuild ? getVehicleCatalogItem(activeBuild.baseVehicleId) : null;

  return (
    <div className="relative min-h-screen w-full bg-[#f4f6f9] text-slate-900 font-sans flex flex-col justify-between p-4 md:p-6 overflow-y-auto">
      {/* Top Header Navigation */}
      <header className="esf-panel w-full flex items-center justify-between rounded-2xl px-5 py-3.5 shadow-sm bg-white/90 backdrop-blur-md border border-slate-200 mb-6 shrink-0">
        <div className="hidden md:flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f95738]/10 text-[#f95738] border border-[#f95738]/20">
            <img src="/images/favicon.ico" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900 uppercase">Vehicle Studio</h1>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              {activeBuild ? `Simulating performance telemetry for ${activeBuild.name}` : "Vehicle performance testing and aerodynamic simulation area."}
            </p>
          </div>
        </div>

        {/* Top Navigation */}
        <Navbar />
      </header>

      {/* Main Workspace Content */}
      <div className="flex-1 flex flex-col items-center justify-center my-4">
        {activeBuild && activeBaseVehicle ? (
          <div className="w-full max-w-5xl space-y-5">
            {/* Active Test Build Header Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-white font-bold shrink-0 shadow-sm">
                  <Zap size={22} className="text-[#f95738]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f95738] bg-[#f95738]/10 px-2.5 py-0.5 rounded-md border border-[#f95738]/20 font-mono">
                      ACTIVE TEST SPECIMEN
                    </span>
                    <span className="text-xs text-slate-400 font-mono">ID: {activeBuild.id}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{activeBuild.name}</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Base Model: {activeBaseVehicle.name} · {Object.keys(activeBuild.materialOverrides || {}).length} custom parts
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => router.push(`/build?vehicle=${activeBuild.baseVehicleId}&buildId=${activeBuild.id}`)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-extrabold text-xs uppercase tracking-wider transition-all border border-stone-200 cursor-pointer"
                >
                  <Car size={15} />
                  <span>Edit in Build</span>
                </button>
              </div>
            </div>

            {/* 3D Model + Telemetry Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 3D Preview */}
              <div className="lg:col-span-7 h-[360px] sm:h-[420px] relative rounded-3xl overflow-hidden esf-panel p-2 bg-white border border-slate-200 shadow-sm flex flex-col">
                <div className="flex-1 w-full h-full relative">
                  <Garage3DPreview
                    buildId={activeBuild.id}
                    modelPath={activeBaseVehicle.modelPath}
                    vehicleName={activeBuild.name}
                    materialOverrides={activeBuild.materialOverrides}
                  />
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                    <Sparkles size={14} className="text-[#f95738]" />
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">{activeBaseVehicle.type}</span>
                  </div>
                </div>
              </div>

              {/* Simulation Suite Cards */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 mb-1 flex items-center gap-2">
                    <Gauge size={18} className="text-[#f95738]" />
                    TELEMETRY & SIMULATION
                  </h3>
                  <p className="text-xs text-slate-500 mb-5">Live telemetry feedback for {activeBuild.name}.</p>

                  <div className="space-y-3">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wind size={18} className="text-[#f95738]" />
                        <div>
                          <div className="text-xs font-extrabold text-slate-800">Aerodynamic Cd</div>
                          <div className="text-[10px] text-slate-400 font-mono">Drag Coefficient</div>
                        </div>
                      </div>
                      <span className="text-sm font-extrabold text-slate-900 font-mono">0.28 Cd</span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Activity size={18} className="text-[#f95738]" />
                        <div>
                          <div className="text-xs font-extrabold text-slate-800">0-100 km/h</div>
                          <div className="text-[10px] text-slate-400 font-mono">Acceleration</div>
                        </div>
                      </div>
                      <span className="text-sm font-extrabold text-slate-900 font-mono">3.4 s</span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Zap size={18} className="text-[#f95738]" />
                        <div>
                          <div className="text-xs font-extrabold text-slate-800">Dyno Output</div>
                          <div className="text-[10px] text-slate-400 font-mono">Powertrain Curve</div>
                        </div>
                      </div>
                      <span className="text-sm font-extrabold text-slate-900 font-mono">{activeBaseVehicle.specs.power}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                  <span className="text-xs text-emerald-600 font-extrabold flex items-center gap-1.5">
                    <CheckCircle2 size={15} />
                    <span>Build Ready for Track Test</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
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
              The vehicle testing and dynamics environment allows evaluating aerodynamic drag, cornering telemetry, and powertrain output curves across customized builds. Select a saved build in Garage to test its specific configuration!
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
              onClick={() => router.push("/garage")}
              className="inline-flex items-center gap-2 py-3.5 px-6 rounded-2xl bg-[#f95738] hover:bg-[#e0482b] text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-md active:scale-[0.98] group cursor-pointer"
            >
              <Car size={16} />
              <span>Select Saved Build in Garage</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

