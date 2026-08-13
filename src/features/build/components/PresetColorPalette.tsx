"use client";

import React from "react";

interface PresetColorPaletteProps {
  currentColor: string;
  onSelectColor: (color: string) => void;
}

const COLOR_PRESETS = [
  { name: "Apex Orange", hex: "#f95738" },
  { name: "Rosso Red", hex: "#d62828" },
  { name: "Monaco Blue", hex: "#1d4ed8" },
  { name: "Daytona Black", hex: "#111827" },
  { name: "Titanium Silver", hex: "#94a3b8" },
  { name: "Glacier White", hex: "#ffffff" },
  { name: "Signal Yellow", hex: "#eab308" },
  { name: "Emerald Green", hex: "#059669" },
];

export const PresetColorPalette: React.FC<PresetColorPaletteProps> = ({
  currentColor,
  onSelectColor,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        Preset Paint Finish
      </label>
      <div className="grid grid-cols-4 gap-2">
        {COLOR_PRESETS.map((preset) => {
          const isActive = currentColor.toLowerCase() === preset.hex.toLowerCase();
          return (
            <button
              key={preset.hex}
              type="button"
              onClick={() => onSelectColor(preset.hex)}
              title={preset.name}
              className={`group relative h-7 rounded-lg border transition-all duration-150 hover:cursor-pointer ${isActive
                ? "border-[#f95738] scale-105 ring-2 ring-[#f95738]/30"
                : "border-slate-200 hover:border-slate-400 hover:scale-105"
                }`}
              style={{ backgroundColor: preset.hex }}
            >
              {isActive && (
                <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${preset.hex === "#ffffff" ? "text-slate-900" : "text-white"
                  }`}>
                  ✓
                </span>
              )}
            </button>
          );
        })}
        <label className="text-[12px] mt-1 text-[#000]">Custom</label>
        <input
          type="color"
          value={currentColor}
          onChange={(e) => onSelectColor(e.target.value)}
          className={`group relative h-7 rounded-lg transition-all duration-150 hover:cursor-pointer`}
          title="Pick a custom paint colour"
        />
        <input
          type="text"
          value={currentColor.toUpperCase()}
          readOnly
          className="flex-1 h-7 px-2 text-[11px] font-mono border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:border-[#e0564d]"
          maxLength={7}
        />
      </div>
    </div>
  );
};
