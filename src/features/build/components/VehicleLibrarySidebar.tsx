"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { VEHICLE_CATALOG } from "@/core/domain/vehicleCatalog";

interface VehicleLibrarySidebarProps {
  selectedVehicleId: string;
  onSelectVehicle: (vehicleId: string) => void;
}

export const VehicleLibrarySidebar: React.FC<VehicleLibrarySidebarProps> = ({
  selectedVehicleId,
  onSelectVehicle,
}) => {
  return (
    <aside className="hidden lg:flex w-full lg:w-72 xl:w-80 shrink-0 flex-col border border-[#e8e2d5] bg-[#f7f4ed] rounded-2xl h-full min-h-0 overflow-hidden">
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
          const isSelected = vehicle.id === selectedVehicleId;
          const imgUrl = vehicle.screenshotPath || null;
          return (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => onSelectVehicle(vehicle.id)}
              className={`w-full text-left p-3 rounded-2xl transition-all border flex items-center gap-3 group relative cursor-pointer ${
                isSelected
                  ? "bg-white border-[#e0564d] shadow-xs ring-1 ring-[#e0564d]/30"
                  : "bg-white/60 hover:bg-white border-stone-200/90 hover:border-stone-300 shadow-2xs"
              }`}
            >
              {/* Vehicle Thumbnail */}
              <div
                className={`flex h-13 w-16 shrink-0 items-center justify-center rounded-xl overflow-hidden border transition-colors ${
                  isSelected ? "border-[#e0564d]/30 bg-stone-50" : "border-stone-200 bg-stone-100"
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
  );
};
