"use client";

import React, { useState, useMemo } from "react";
import { ChevronRight, ChevronDown, Car, Cpu, Zap, Box, Disc } from "lucide-react";
import { useVehicleStore, getPartByMeshName, VEHICLE_PARTS_DATA } from "@/core/state/useVehicleStore";
import type { VehiclePartData } from "@/core/domain/vehicle";

const CATEGORY_META = {
  BODY: { label: "Body", icon: Car, color: "text-[#e0564d]", accent: "bg-[#e0564d]" },
  COCKPIT: { label: "Cockpit", icon: Cpu, color: "text-purple-600", accent: "bg-purple-600" },
  POWER: { label: "Power", icon: Zap, color: "text-amber-500", accent: "bg-amber-500" },
  CHASSIS: { label: "Chassis", icon: Box, color: "text-slate-500", accent: "bg-slate-500" },
  WHEELS: { label: "Wheels", icon: Disc, color: "text-blue-500", accent: "bg-blue-500" },
} as const;

const CATEGORIES = ["BODY", "COCKPIT", "POWER", "CHASSIS", "WHEELS"] as const;

export const AssemblyTreePanel: React.FC = () => {
  const { selectedMeshName, setSelectedMesh, availableMeshNames } = useVehicleStore();

  const [open, setOpen] = useState<Record<string, boolean>>({
    BODY: true,
    COCKPIT: true,
    POWER: true,
    CHASSIS: false,
    WHEELS: true,
  });

  const toggle = (cat: string) => setOpen((prev) => ({ ...prev, [cat]: !prev[cat] }));

  // Dynamically resolve actual loaded GLB mesh names into VehiclePartData objects
  const activePartsList: VehiclePartData[] = useMemo(() => {
    if (availableMeshNames && availableMeshNames.length > 0) {
      return availableMeshNames
        .map((meshName) => getPartByMeshName(meshName))
        .filter((part): part is VehiclePartData => part !== null);
    }
    return VEHICLE_PARTS_DATA;
  }, [availableMeshNames]);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: "#f7f4ed" }}>
      {/* Panel header */}
      <div className="shrink-0 px-4 py-3 border-b border-[#e8e2d5]">
        <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block">Anatomy</span>
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-800">Components</h2>
      </div>

      {/* Scrollable tree */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-3 space-y-1">
        {CATEGORIES.map((cat) => {
          const parts = activePartsList.filter((p) => p.category === cat);
          if (parts.length === 0) return null; // Do not render empty categories

          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const isOpen = open[cat] ?? true;
          const hasSelected = parts.some((p) => p.meshName === selectedMeshName);

          return (
            <div key={cat}>
              {/* Category row */}
              <button
                type="button"
                onClick={() => toggle(cat)}
                className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                  hasSelected
                    ? "bg-stone-100 text-stone-900"
                    : "hover:bg-stone-100/70 text-stone-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={13} className={meta.color} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">{meta.label}</span>
                  <span className="text-[10px] text-stone-400 font-mono">({parts.length})</span>
                </div>
                {isOpen
                  ? <ChevronDown size={13} className="text-stone-400 shrink-0" />
                  : <ChevronRight size={13} className="text-stone-400 shrink-0" />
                }
              </button>

              {/* Parts list */}
              {isOpen && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-[#e8e2d5] pl-2">
                  {parts.map((part) => {
                    const isSelected = selectedMeshName === part.meshName;
                    return (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => setSelectedMesh(isSelected ? null : part.meshName)}
                        className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-all text-xs ${
                          isSelected
                            ? "bg-white border border-[#e0564d]/30 text-stone-900 font-semibold shadow-sm"
                            : "text-stone-600 hover:bg-white hover:shadow-sm border border-transparent"
                        }`}
                      >
                        {/* Active indicator dot */}
                        <span
                          className={`shrink-0 h-1.5 w-1.5 rounded-full transition-colors ${
                            isSelected ? meta.accent : "bg-stone-200"
                          }`}
                        />
                        <span className="truncate leading-tight">{part.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
