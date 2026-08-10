"use client";

import React from "react";
import { X, Paintbrush, Zap, Lightbulb, Box, RotateCcw, Save, CheckCircle2 } from "lucide-react";
import { useVehicleStore } from "@/core/state/useVehicleStore";
import { PresetColorPalette } from "./PresetColorPalette";

interface PartInspectorPanelProps {
  onUpdateMaterial: (
    meshName: string,
    config: { color?: string; roughness?: number; metalness?: number; opacity?: number; wireframe?: boolean }
  ) => void;
  onSave?: () => void;
  onDiscard?: () => void;
  isSaved?: boolean;
  isDirty?: boolean;
}

export const PartInspectorPanel: React.FC<PartInspectorPanelProps> = ({
  onUpdateMaterial,
  onSave,
  onDiscard,
  isSaved = false,
  isDirty = false,
}) => {
  const { selectedPart, selectedMeshName, setSelectedMesh, materialOverrides, updatePartMaterial } =
    useVehicleStore();

  // ── Action Footer buttons helper ──
  const renderActionFooter = () => (
    <div className="shrink-0 p-3.5 border-t border-[#e8e2d5] bg-[#f7f4ed] flex items-center gap-2.5 z-10">
      <button
        type="button"
        onClick={onDiscard}
        disabled={!isDirty}
        className={
          isDirty
            ? "flex-1 py-2.5 px-3 rounded-xl border border-stone-300 bg-white text-stone-700 font-bold text-xs hover:bg-stone-50 hover:border-stone-400 transition-all shadow-2xs flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
            : "flex-1 py-2.5 px-3 rounded-xl border border-stone-200 bg-stone-100 text-stone-400 font-bold text-xs flex items-center justify-center gap-1.5 opacity-60 cursor-not-allowed"
        }
      >
        <RotateCcw size={13} className={isDirty ? "text-stone-500" : "text-stone-400"} />
        <span>Discard</span>
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={!isDirty && !isSaved}
        className={
          isSaved
            ? "flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
            : isDirty
            ? "flex-1 py-2.5 px-3 rounded-xl bg-[#e0564d] hover:bg-[#c9463e] text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
            : "flex-1 py-2.5 px-3 rounded-xl bg-stone-300 text-stone-500 font-bold text-xs flex items-center justify-center gap-1.5 opacity-60 cursor-not-allowed"
        }
      >
        {isSaved ? <CheckCircle2 size={13} /> : <Save size={13} />}
        <span>{isSaved ? "Saved" : "Save to Garage"}</span>
      </button>
    </div>
  );

  // ── Empty state ─────────────────────────────
  if (!selectedPart || !selectedMeshName) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: "#f7f4ed" }}>
        {/* Panel header */}
        <div className="shrink-0 px-4 py-3 border-b border-[#e8e2d5]">
          <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block">Customize</span>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-800">Inspector</h2>
        </div>
        {/* Placeholder */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="h-12 w-12 rounded-2xl bg-[#f2ebd9] border border-[#e8e2d5] flex items-center justify-center text-[#e0564d] mb-3">
            <Box size={22} />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#e0564d] mb-1">Inspector</p>
          <p className="text-sm font-bold text-stone-800">No Component Selected</p>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed max-w-[200px]">
            Click a component directly on the 3D vehicle to inspect and customize it.
          </p>
        </div>

        {/* Action Footer */}
        {renderActionFooter()}
      </div>
    );
  }

  // ── Material overrides ───────────────────────
  const overrides = materialOverrides[selectedMeshName] ?? {};
  const currentColor    = overrides.color      ?? selectedPart.defaultMaterial.color;
  const currentRoughness= overrides.roughness  ?? selectedPart.defaultMaterial.roughness;
  const currentMetalness= overrides.metalness  ?? selectedPart.defaultMaterial.metalness;
  const currentWireframe= overrides.wireframe  ?? selectedPart.defaultMaterial.wireframe;

  const handleColor = (color: string) => {
    updatePartMaterial(selectedMeshName, { color });
    onUpdateMaterial(selectedMeshName, { color });
  };
  const handleRoughness = (roughness: number) => {
    updatePartMaterial(selectedMeshName, { roughness });
    onUpdateMaterial(selectedMeshName, { roughness });
  };
  const handleMetalness = (metalness: number) => {
    updatePartMaterial(selectedMeshName, { metalness });
    onUpdateMaterial(selectedMeshName, { metalness });
  };
  const handleWireframe = (wireframe: boolean) => {
    updatePartMaterial(selectedMeshName, { wireframe });
    onUpdateMaterial(selectedMeshName, { wireframe });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: "#f7f4ed" }}>

      {/* Panel header */}
      <div className="shrink-0 px-4 py-3 border-b border-[#e8e2d5]">
        <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block">Customize</span>
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-800">Inspector</h2>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-5">

        {/* Component title card */}
        <div className="bg-white rounded-2xl border border-[#e8e2d5] p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[9px] font-bold uppercase tracking-widest text-[#e0564d] mb-0.5">
                {selectedPart.category}
              </div>
              <h3 className="text-sm font-extrabold text-stone-900 leading-tight">
                {selectedPart.name}
              </h3>
              <p className="text-[10px] text-stone-500 mt-1 leading-relaxed line-clamp-2">
                {selectedPart.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMesh(null)}
              className="shrink-0 h-6 w-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
              title="Deselect"
            >
              <X size={12} />
            </button>
          </div>

          {/* Specs */}
          {Object.keys(selectedPart.specs).length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#f2ebd9] grid grid-cols-2 gap-y-2 gap-x-3">
              {Object.entries(selectedPart.specs).map(([k, v]) => (
                <div key={k}>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-stone-400">{k}</div>
                  <div className="text-[11px] font-semibold text-stone-700 leading-tight mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Surface Finish & Paint */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <Paintbrush size={13} className="text-[#e0564d]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700">Surface &amp; Paint</span>
          </div>

          <PresetColorPalette currentColor={currentColor} onSelectColor={handleColor} />

          {/* Roughness slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-stone-600 font-medium">
              <span>Roughness</span>
              <span>{Math.round(currentRoughness * 100)}%</span>
            </div>
            <input
              type="range"
              min="0" max="1" step="0.02"
              value={currentRoughness}
              onChange={(e) => handleRoughness(parseFloat(e.target.value))}
              className="w-full accent-[#e0564d] cursor-pointer"
            />
          </div>

          {/* Metalness slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-stone-600 font-medium">
              <span>Metalness</span>
              <span>{Math.round(currentMetalness * 100)}%</span>
            </div>
            <input
              type="range"
              min="0" max="1" step="0.02"
              value={currentMetalness}
              onChange={(e) => handleMetalness(parseFloat(e.target.value))}
              className="w-full accent-[#e0564d] cursor-pointer"
            />
          </div>

          {/* Wireframe toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-stone-600 font-medium">Wireframe</span>
            <button
              type="button"
              onClick={() => handleWireframe(!currentWireframe)}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                currentWireframe
                  ? "bg-[#e0564d] border-[#e0564d] text-white"
                  : "bg-white border-[#e8e2d5] text-stone-600 hover:border-stone-400"
              }`}
            >
              {currentWireframe ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Info callouts */}
        <div className="space-y-2">
          <div className="bg-[#f5f3ff] border border-[#e9d5ff] rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-900 mb-1">
              <Zap size={11} className="text-purple-600" />
              Engineering importance
            </div>
            <p className="text-[10px] text-purple-800 leading-relaxed">
              Optimizes structural stiffness and aerodynamic stability during high-speed cornering dynamics.
            </p>
          </div>

          <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-900 mb-1">
              <Lightbulb size={11} className="text-amber-500" />
              Did you know
            </div>
            <p className="text-[10px] text-amber-800 leading-relaxed">
              Aerospace-grade carbon prepreg achieves one of the highest strength-to-weight ratios in engineering.
            </p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      {renderActionFooter()}
    </div>
  );
};


