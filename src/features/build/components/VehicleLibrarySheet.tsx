"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, BookOpen } from "lucide-react";
import { VEHICLE_CATALOG } from "@/core/domain/vehicleCatalog";

interface VehicleLibrarySheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVehicleId: string;
  onSelectVehicle: (vehicleId: string) => void;
}

export const VehicleLibrarySheet: React.FC<VehicleLibrarySheetProps> = ({
  isOpen,
  onClose,
  selectedVehicleId,
  onSelectVehicle,
}) => {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Trigger smooth entrance animation after mounting
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setActive(true);
        });
      });
    } else {
      setActive(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setActive(false);
    setTimeout(() => {
      onClose();
    }, 350);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end items-center pointer-events-auto">
      {/* Dimmed & Blurred Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs"
        style={{
          opacity: active ? 1 : 0,
          transition: "opacity 320ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Anatomy-Inspired Bottom Sheet / Drawer Panel */}
      <div
        className="relative w-full max-w-lg bg-[#f7f4ed] border-t border-x border-[#e8e2d5] rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[72dvh] sm:max-h-[80dvh] z-10"
        style={{
          transform: active ? "translateY(0)" : "translateY(100%)",
          transition: "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Top Handle Bar Indicator */}
        <div className="pt-2.5 pb-1 flex justify-center bg-[#f7f4ed] shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-stone-300/80" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-5 pb-3 pt-1 border-b border-[#e8e2d5] flex items-center justify-between bg-[#f7f4ed] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e0564d]/10 text-[#e0564d] border border-[#e0564d]/20">
              <BookOpen size={14} />
            </div>
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-stone-400 font-mono block">
                BASE VEHICLES
              </span>
              <h2 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                MODEL LIBRARY ({VEHICLE_CATALOG.length})
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-[#e8e2d5] text-stone-400 hover:text-stone-700 transition-colors shadow-2xs cursor-pointer"
            aria-label="Close Library"
          >
            <X size={16} />
          </button>
        </div>

        {/* Vehicle Specimen List */}
        <div className="p-3 sm:p-4 space-y-2.5 overflow-y-auto flex-1">
          {VEHICLE_CATALOG.map((vehicle) => {
            const isSelected = vehicle.id === selectedVehicleId;
            const imgUrl = vehicle.screenshotPath || null;
            return (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => {
                  onSelectVehicle(vehicle.id);
                  handleClose();
                }}
                className={`w-full text-left p-3.5 rounded-2xl transition-all border flex items-center gap-3.5 group relative cursor-pointer ${
                  isSelected
                    ? "bg-white border-[#e0564d] shadow-sm ring-1 ring-[#e0564d]/30"
                    : "bg-white/70 hover:bg-white border-stone-200/90 hover:border-stone-300 shadow-2xs"
                }`}
              >
                {/* Thumbnail */}
                <div
                  className={`flex h-14 w-18 shrink-0 items-center justify-center rounded-xl overflow-hidden border transition-colors ${
                    isSelected ? "border-[#e0564d]/30 bg-stone-50" : "border-stone-200 bg-stone-100"
                  }`}
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={vehicle.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <CheckCircle2 size={20} className={isSelected ? "text-[#e0564d]" : "text-stone-400"} />
                  )}
                </div>

                {/* Vehicle Details */}
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

                  <h3 className="text-xs sm:text-sm font-extrabold text-stone-900 truncate">
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
      </div>
    </div>,
    document.body
  );
};
