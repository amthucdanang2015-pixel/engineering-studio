"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Gauge,
  Layers,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { VEHICLE_CATALOG, type VehicleCatalogItem } from "@/core/domain/vehicleCatalog";
import { Garage3DPreview } from "@/features/garage/components/Garage3DPreview";
import { TopNav } from "@/components/TopNav";

export const BuildCatalogView: React.FC = () => {
  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleCatalogItem>(VEHICLE_CATALOG[0]);

  const handleStartBuilding = () => {
    router.push(`/build?vehicle=${selectedVehicle.id}`);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#f4f6f9] text-slate-900 font-sans flex flex-col justify-between p-4 md:p-6 overflow-y-auto">
      {/* Top Header Navigation */}
      <header className="esf-panel w-full flex items-center justify-between rounded-2xl px-5 py-3.5 shadow-sm bg-white/90 backdrop-blur-md border border-slate-200 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f95738]/10 text-[#f95738] border border-[#f95738]/20">
            <Activity size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">ESF V2</span>
              <span className="text-slate-300">/</span>
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900 uppercase">VEHICLE CATALOG</h1>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Select a base vehicle architecture to start customizing in the workspace.
            </p>
          </div>
        </div>

        {/* Top Navigation */}
        <TopNav />
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Large 3D Vehicle Hero Viewport */}
        <div className="lg:col-span-8 h-[400px] sm:h-[480px] lg:h-[540px] relative rounded-3xl overflow-hidden esf-panel p-2 bg-white border border-slate-200 shadow-sm flex flex-col">
          <div className="flex-1 w-full h-full relative">
            <Garage3DPreview modelPath={selectedVehicle.modelPath} vehicleName={selectedVehicle.name} />

            {/* Badge overlay on top of 3D preview */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-sm">
              <Sparkles size={14} className="text-[#f95738]" />
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">{selectedVehicle.type}</span>
            </div>
          </div>
        </div>

        {/* Selected Vehicle Details Panel */}
        <div className="lg:col-span-4 flex flex-col justify-between esf-panel p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f95738] bg-[#f95738]/10 px-2.5 py-1 rounded-md border border-[#f95738]/20">
                Active Base Selection
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {selectedVehicle.id}</span>
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">
              {selectedVehicle.name}
            </h2>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {selectedVehicle.description}
            </p>

            {/* Technical Specifications Grid */}
            <div className="space-y-3 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Vehicle Specifications
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Cpu size={14} />
                    <span className="text-[10px] font-semibold uppercase">Powertrain</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 block truncate">{selectedVehicle.specs.engine}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Zap size={14} />
                    <span className="text-[10px] font-semibold uppercase">Output</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 block">{selectedVehicle.specs.power}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Gauge size={14} />
                    <span className="text-[10px] font-semibold uppercase">Total Weight</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 block">{selectedVehicle.specs.weight}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Layers size={14} />
                    <span className="text-[10px] font-semibold uppercase">Drivetrain</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 block truncate">{selectedVehicle.specs.drivetrain}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTA Button */}
          <button
            type="button"
            onClick={handleStartBuilding}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#f95738] hover:bg-[#e0482b] text-white font-extrabold text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.99] group mt-4"
          >
            <span>Start Building</span>
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Bottom Vehicle Catalog Selection Cards Bar */}
      <section className="w-full shrink-0">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">SELECT BASE VEHICLE MODEL</h3>
            <span className="text-xs font-bold text-[#f95738] bg-[#f95738]/10 px-2 py-0.5 rounded-full font-mono">{VEHICLE_CATALOG?.length} Models</span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Click a vehicle card to preview and configure</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-2">
          {VEHICLE_CATALOG.map((vehicle) => {
            const isSelected = vehicle.id === selectedVehicle.id;
            const imgUrl = vehicle.screenshotPath || null;
            return (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => setSelectedVehicle(vehicle)}
                className={`text-left p-4 rounded-2xl transition-all border flex items-start gap-4 ${isSelected
                  ? "bg-white border-[#f95738] shadow-md ring-2 ring-[#f95738]/20"
                  : "bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                  }`}
              >
                {/* Status Icon */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${isSelected ? "bg-[#f95738] text-white shadow-sm" : "bg-slate-100 text-slate-500"
                    }`}
                >
                  {imgUrl ? <img src={imgUrl} alt={vehicle.name} className="w-full h-full object-cover rounded-xl" /> : <CheckCircle2 size={20} />}
                </div>

                {/* Card Information */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#f95738]">
                      {vehicle.type}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-extrabold uppercase tracking-wider bg-[#f95738]/10 text-[#f95738] px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-900 truncate mb-1">{vehicle.name}</h4>

                  <p className="text-xs text-slate-500 line-clamp-1 font-mono">{vehicle.specs.engine}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
