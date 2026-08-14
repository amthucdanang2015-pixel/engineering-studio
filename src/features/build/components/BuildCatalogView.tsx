"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Gauge,
  Layers,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { VEHICLE_CATALOG, getVehicleCatalogItem } from "@/core/domain/vehicleCatalog";
import { Garage3DPreview } from "@/features/garage/components/Garage3DPreview";
import { Navbar } from "@/components/layout/Navbar";
import { VehicleLibrarySheet } from "./VehicleLibrarySheet";

export const BuildCatalogView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const selectedVehicle = getVehicleCatalogItem(viewParam);

  const handleSelectVehicle = (vehicleId: string) => {
    router.replace(`/build?view=${vehicleId}`, { scroll: false });
  };

  const handleStartBuilding = () => {
    router.push(`/build?vehicle=${selectedVehicle.id}`);
  };

  return (
    <div className="relative min-h-screen lg:h-[100dvh] lg:max-h-[100dvh] w-full bg-[#f4f6f9] text-slate-900 font-sans flex flex-col justify-between p-4 md:p-5 overflow-y-auto lg:overflow-hidden">
      {/* ── TOP HEADER NAVIGATION BAR ──────────────────────────────── */}
      <Navbar />

      {/* ── MAIN STUDIO WORKSPACE LAYOUT ───────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 lg:h-[calc(100dvh-56px)] overflow-visible lg:overflow-hidden">

        {/* ── LEFT SIDEBAR: BASE VEHICLE LIBRARY (Desktop only: hidden lg:flex) ── */}
        <aside className="hidden lg:flex w-full lg:w-72 xl:w-80 shrink-0 flex-col border-b lg:border-b-0 lg:border-r  border border-[#e8e2d5] rounded-2xl h-full min-h-0 overflow-hidden">
          {/* Library Panel Header */}
          <div className="p-4 sm:px-5 py-3.5 border-b border-[#e8e2d5] flex items-center justify-between bg-[#f7f4ed] shrink-0">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 font-mono block">
                BASE VEHICLES
              </span>
              <h2 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
                MODEL LIBRARY
              </h2>
            </div>
            <span className="text-[10px] font-extrabold text-[#e0564d] bg-[#e0564d]/10 border border-[#e0564d]/20 px-2.5 py-1 rounded-full font-mono">
              {VEHICLE_CATALOG.length} MODELS
            </span>
          </div>

          {/* Model Specimen List */}
          <div className="p-3 sm:p-4 space-y-2.5 overflow-y-auto flex-1 min-h-0">
            {VEHICLE_CATALOG.map((vehicle) => {
              const isSelected = vehicle.id === selectedVehicle.id;
              const imgUrl = vehicle.screenshotPath || null;
              return (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => handleSelectVehicle(vehicle.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all border flex items-center gap-3 group relative cursor-pointer ${isSelected
                    ? "bg-white border-[#e0564d] shadow-xs ring-1 ring-[#e0564d]/30"
                    : "bg-white/60 hover:bg-white border-stone-200/90 hover:border-stone-300 shadow-2xs"
                    }`}
                >
                  {/* Vehicle Thumbnail */}
                  <div
                    className={`flex h-13 w-16 shrink-0 items-center justify-center rounded-xl overflow-hidden border transition-colors ${isSelected ? "border-[#e0564d]/30 bg-stone-50" : "border-stone-200 bg-stone-100"
                      }`}
                  >
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={vehicle.name}
                        className="w-full h-full object-cover rounded-xl transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <CheckCircle2 size={20} className={isSelected ? "text-[#e0564d]" : "text-stone-400"} />
                    )}
                  </div>

                  {/* Vehicle Card Information */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-stone-400 truncate">
                        {vehicle.type}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] font-extrabold uppercase tracking-wider bg-[#e0564d]/10 text-[#e0564d] px-2 py-0.5 rounded-md shrink-0">
                          Selected
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs sm:text-sm font-extrabold text-stone-900 truncate group-hover:text-[#e0564d] transition-colors">
                      {vehicle.name}
                    </h3>

                    <p className="text-[10px] text-stone-500 font-mono truncate mt-0.5">
                      {vehicle.specs.engine}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── RIGHT MAIN WORKSPACE: 3D SPECIMEN VIEWER & DETAILS ───── */}
        <main className="flex-1 flex flex-col lg:flex-row overflow-visible lg:overflow-hidden relative bg-[#f7f4ed] p-3 sm:p-4 lg:p-4 gap-3 sm:gap-4 lg:gap-4 min-h-0 h-full">

          {/* 3D Vehicle Viewport Hero Area - Fills available workspace height on desktop */}
          <div className="w-full lg:flex-1 h-[60vh] min-h-[340px] max-h-[520px] lg:max-h-none lg:h-full relative rounded-2xl overflow-hidden border border-[#e8e2d5] bg-[#f2ebd9] p-2 sm:p-3 touch-pan-y shrink-0 lg:shrink flex flex-col">
            <div className="relative w-full h-full rounded-xl overflow-hidden">
              <Garage3DPreview
                buildId={selectedVehicle.id}
                modelPath={selectedVehicle.modelPath}
                vehicleName={selectedVehicle.name}
              />

              {/* Specimen Category Badge Overlay */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#e8e2d5] shadow-2xs">
                <Sparkles size={14} className="text-[#e0564d]" />
                <span className="text-[11px] font-extrabold text-stone-800 uppercase tracking-wider">
                  {selectedVehicle.type}
                </span>
              </div>
            </div>
          </div>

          {/* Selected Vehicle Specimen Info & Action Panel - Positioned below 3D viewer on mobile */}
          <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0 border border-[#e8e2d5] bg-[#f7f4ed] rounded-2xl p-4 sm:p-5 flex flex-col justify-between overflow-y-auto min-h-0 h-auto lg:h-full">
            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#e0564d] bg-[#e0564d]/10 px-2.5 py-1 rounded-md border border-[#e0564d]/20 font-mono">
                  ACTIVE BASE SPECIMEN
                </span>
                <span className="text-[10px] text-stone-400 font-mono">ID: {selectedVehicle.id}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-stone-900 mb-2">
                {selectedVehicle.name}
              </h2>

              <p className="text-xs text-stone-600 leading-relaxed mb-5 font-medium">
                {selectedVehicle.description}
              </p>

              {/* Specifications Grid */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 font-mono">
                    SPECIFICATION METRICS
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">ESF V2 ARCHITECTURE</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2.5 rounded-xl border border-[#e8e2d5] shadow-2xs">
                    <div className="flex items-center gap-1.5 text-stone-400 mb-0.5">
                      <Cpu size={13} className="text-[#e0564d]" />
                      <span className="text-[9px] font-extrabold uppercase tracking-wider">Powertrain</span>
                    </div>
                    <span className="text-xs font-extrabold text-stone-800 block truncate">
                      {selectedVehicle.specs.engine}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-[#e8e2d5] shadow-2xs">
                    <div className="flex items-center gap-1.5 text-stone-400 mb-0.5">
                      <Zap size={13} className="text-[#e0564d]" />
                      <span className="text-[9px] font-extrabold uppercase tracking-wider">Output</span>
                    </div>
                    <span className="text-xs font-extrabold text-stone-800 block">
                      {selectedVehicle.specs.power}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-[#e8e2d5] shadow-2xs">
                    <div className="flex items-center gap-1.5 text-stone-400 mb-0.5">
                      <Gauge size={13} className="text-[#e0564d]" />
                      <span className="text-[9px] font-extrabold uppercase tracking-wider">Total Weight</span>
                    </div>
                    <span className="text-xs font-extrabold text-stone-800 block">
                      {selectedVehicle.specs.weight}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-[#e8e2d5] shadow-2xs">
                    <div className="flex items-center gap-1.5 text-stone-400 mb-0.5">
                      <Layers size={13} className="text-[#e0564d]" />
                      <span className="text-[9px] font-extrabold uppercase tracking-wider">Drivetrain</span>
                    </div>
                    <span className="text-xs font-extrabold text-stone-800 block truncate">
                      {selectedVehicle.specs.drivetrain}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Start Building Action CTA */}
            <div className="pt-3 border-t border-[#e8e2d5]/80 shrink-0 mt-3">
              <button
                type="button"
                onClick={handleStartBuilding}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-[#e0564d] hover:bg-[#c9463e] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-[0.99] group cursor-pointer"
              >
                <span>Start Building</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ── MOBILE VEHICLE LIBRARY SHEET OVERLAY ─────────────────── */}
      <VehicleLibrarySheet
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        selectedVehicleId={selectedVehicle.id}
        onSelectVehicle={handleSelectVehicle}
      />
    </div>
  );
};
