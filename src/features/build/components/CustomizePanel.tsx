"use client";

import React, { useCallback } from "react";
import {
  Paintbrush,
  CircleDot,
  Glasses,
  Lightbulb,
  RotateCcw,
  Save,
  CheckCircle2,
  Disc3,
  Wrench,
  Sparkles,
} from "lucide-react";
import { useVehicleStore } from "@/core/state/useVehicleStore";
import type {
  GlassTint,
  TrimFinish,
  HeadlightStyle,
} from "@/core/domain/vehicleCustomization";
import type { VehicleCapabilities } from "@/core/domain/vehicleCapabilities";

// ─────────────────────────────────────────────────────────────────────────────
// PAINT PRESETS — automotive grade colour palette
// ─────────────────────────────────────────────────────────────────────────────
const PAINT_PRESETS = [
  { name: "Obsidian Black", hex: "#0d0d0f", metalness: 0.3, roughness: 0.15 },
  { name: "Arctic White", hex: "#f2f1ee", metalness: 0.1, roughness: 0.2 },
  { name: "Glacier Silver", hex: "#8fa0b0", metalness: 0.72, roughness: 0.18 },
  { name: "Racing Red", hex: "#c01308", metalness: 0.2, roughness: 0.22 },
  { name: "Cobalt Blue", hex: "#18388a", metalness: 0.25, roughness: 0.2 },
  { name: "British Racing Green", hex: "#183d24", metalness: 0.2, roughness: 0.22 },
  { name: "Signal Yellow", hex: "#e6b800", metalness: 0.1, roughness: 0.25 },
  { name: "Burnt Orange", hex: "#c45200", metalness: 0.15, roughness: 0.22 },
  { name: "Midnight Purple", hex: "#26185a", metalness: 0.3, roughness: 0.18 },
  { name: "Rose Gold", hex: "#b07070", metalness: 0.62, roughness: 0.2 },
  { name: "Gunmetal", hex: "#363b40", metalness: 0.52, roughness: 0.25 },
  { name: "Pearl Ivory", hex: "#e5ddc4", metalness: 0.15, roughness: 0.2 },
];

const RIM_PRESETS = [
  { name: "Machined Silver", hex: "#8894a0", metalness: 0.85, roughness: 0.18 },
  { name: "Gloss Black", hex: "#0a0a0a", metalness: 0.4, roughness: 0.12 },
  { name: "Gunmetal", hex: "#363b40", metalness: 0.7, roughness: 0.22 },
  { name: "Chrome", hex: "#c5cdd4", metalness: 0.95, roughness: 0.06 },
  { name: "Bronze", hex: "#88672c", metalness: 0.75, roughness: 0.2 },
  { name: "Gold", hex: "#c09c20", metalness: 0.8, roughness: 0.15 },
];

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <span className="text-[#e0564d]">{icon}</span>
      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700">{label}</span>
    </div>
  );
}

function ColorSwatchGrid({
  presets,
  currentHex,
  onSelect,
}: {
  presets: { name: string; hex: string; metalness?: number; roughness?: number }[];
  currentHex: string | undefined;
  onSelect: (hex: string, metalness?: number, roughness?: number) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {presets.map((p) => {
        const active = currentHex?.toLowerCase() === p.hex.toLowerCase();
        return (
          <button
            key={p.hex}
            type="button"
            title={p.name}
            onClick={() => onSelect(p.hex, p.metalness, p.roughness)}
            className={`relative h-7 rounded-lg border-2 transition-all duration-100 hover:scale-110 hover:cursor-pointer ${active
              ? "border-[#e0564d] scale-110 ring-2 ring-[#e0564d]/30"
              : "border-stone-200 hover:border-stone-400"
              }`}
            style={{ backgroundColor: p.hex }}
          >
            {active && (
              <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${p.hex === "#f2f1ee" || p.hex === "#e5ddc4" || p.hex === "#e6b800"
                ? "text-stone-800" : "text-white"
                }`}>✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function OptionChips<T extends string>({
  options,
  current,
  onSelect,
}: {
  options: { value: T; label: string }[];
  current: T | undefined;
  onSelect: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onSelect(o.value)}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all hover:cursor-pointer ${current === o.value
            ? "bg-[#e0564d] border-[#e0564d] text-white shadow-sm"
            : "bg-white border-stone-200 text-stone-600 hover:border-stone-400 hover:bg-stone-50"
            }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-stone-500 font-medium">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range" min="0" max="1" step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[#e0564d] cursor-pointer"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE — shown when GLB has no known customizable materials
// ─────────────────────────────────────────────────────────────────────────────
function EmptyCapabilities() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center gap-3">
      <div className="h-12 w-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center">
        <Wrench size={22} className="text-stone-400" />
      </div>
      <div>
        <p className="text-xs font-bold text-stone-600 mb-1">No Customizable Materials</p>
        <p className="text-[10px] text-stone-400 leading-relaxed">
          This vehicle's GLB does not contain materials that can be safely customized.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING STATE — shown before the analyzer has run
// ─────────────────────────────────────────────────────────────────────────────
function AnalyzingState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center gap-3">
      <div className="h-12 w-12 rounded-2xl bg-[#e0564d]/10 border border-[#e0564d]/20 flex items-center justify-center">
        <Sparkles size={22} className="text-[#e0564d] animate-pulse" />
      </div>
      <div>
        <p className="text-xs font-bold text-stone-600 mb-1">Analyzing Vehicle</p>
        <p className="text-[10px] text-stone-400">Discovering customization options…</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION FOOTER
// ─────────────────────────────────────────────────────────────────────────────
function ActionFooter({
  isDirty,
  isSaved,
  onSave,
  onDiscard,
}: {
  isDirty: boolean;
  isSaved: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
}) {
  return (
    <div className="shrink-0 p-3.5 border-t border-[#e8e2d5] bg-[#f7f4ed] flex items-center gap-2.5">
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
        Reset
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
        {isSaved ? "Saved" : "Save to Garage"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CAPABILITY BADGE — shows what was discovered
// ─────────────────────────────────────────────────────────────────────────────
function CapabilityBadges({ caps }: { caps: VehicleCapabilities }) {
  const badges = [
    { label: "Paint", active: caps.paint.supported },
    { label: "Accent", active: caps.accentPaint.supported },
    { label: "Glass", active: caps.glass.supported },
    { label: "Rims", active: caps.rims.supported },
    { label: "Trim", active: caps.trim.supported },
    { label: "Lights", active: caps.lights.supported },
  ].filter(b => b.active);

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 px-4 pb-2">
      {badges.map(b => (
        <span key={b.label} className="text-[9px] font-bold uppercase tracking-wider text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
          {b.label}
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface CustomizePanelProps {
  /** VehicleCapabilities report from GlbAnalyzer — drives which sections render */
  capabilities: VehicleCapabilities;
  isLoading?: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
  isSaved?: boolean;
  isDirty?: boolean;
}

export const CustomizePanel: React.FC<CustomizePanelProps> = ({
  capabilities,
  isLoading = false,
  onSave,
  onDiscard,
  isSaved = false,
  isDirty = false,
}) => {
  const { vehicleCustomization, setVehicleCustomization } = useVehicleStore();
  const paint = vehicleCustomization.paint;

  // Count supported features so we can show an empty state when none are available
  const supportedCount = [
    capabilities.paint.supported,
    capabilities.accentPaint.supported,
    capabilities.glass.supported,
    capabilities.rims.supported,
    capabilities.trim.supported,
    capabilities.lights.supported,
  ].filter(Boolean).length;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handlePrimaryPaint = useCallback((hex: string, metalness?: number, roughness?: number) => {
    setVehicleCustomization({ paint: { ...vehicleCustomization.paint, primary: hex, ...(metalness !== undefined && { metalness }), ...(roughness !== undefined && { roughness }) } });
  }, [vehicleCustomization.paint, setVehicleCustomization]);

  const handleAccentPaint = useCallback((hex: string) => {
    setVehicleCustomization({ paint: { ...vehicleCustomization.paint, secondary: hex } });
  }, [vehicleCustomization.paint, setVehicleCustomization]);

  const handleMetalness = useCallback((v: number) =>
    setVehicleCustomization({ paint: { ...vehicleCustomization.paint, metalness: v } }),
    [vehicleCustomization.paint, setVehicleCustomization]);

  const handleRoughness = useCallback((v: number) =>
    setVehicleCustomization({ paint: { ...vehicleCustomization.paint, roughness: v } }),
    [vehicleCustomization.paint, setVehicleCustomization]);

  const handleClearcoat = useCallback((v: number) =>
    setVehicleCustomization({ paint: { ...vehicleCustomization.paint, clearcoat: v } }),
    [vehicleCustomization.paint, setVehicleCustomization]);

  const handleGlassTint = useCallback((tint: GlassTint) =>
    setVehicleCustomization({ glass: { tint } }),
    [setVehicleCustomization]);

  const handleRimColor = useCallback((hex: string, metalness?: number, roughness?: number) => {
    setVehicleCustomization({ wheels: { ...vehicleCustomization.wheels, rimColor: hex, ...(metalness !== undefined && { rimMetalness: metalness }), ...(roughness !== undefined && { rimRoughness: roughness }) } });
  }, [vehicleCustomization.wheels, setVehicleCustomization]);

  const handleTrimFinish = useCallback((finish: TrimFinish) =>
    setVehicleCustomization({ trim: { finish } }),
    [setVehicleCustomization]);

  const handleHeadlightStyle = useCallback((s: HeadlightStyle) =>
    setVehicleCustomization({ lights: { ...vehicleCustomization.lights, headlightStyle: s } }),
    [vehicleCustomization.lights, setVehicleCustomization]);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: "#f7f4ed" }}>

      {/* Panel header */}
      <div className="shrink-0 px-4 py-3 border-b border-[#e8e2d5]">
        <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block">GLB Configurator</span>
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-800">Customize</h2>
      </div>

      {/* Capability badges */}
      {!isLoading && supportedCount > 0 && (
        <div className="shrink-0 pt-3">
          <CapabilityBadges caps={capabilities} />
        </div>
      )}

      {/* Body */}
      {isLoading ? (
        <AnalyzingState />
      ) : supportedCount === 0 ? (
        <EmptyCapabilities />
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">

          {/* ── PRIMARY PAINT ────────────────────────────────────────────── */}
          {capabilities.paint.supported && (
            <div className="bg-white rounded-2xl border border-[#e8e2d5] p-4 shadow-sm space-y-3.5">
              <SectionHeader icon={<Paintbrush size={13} />} label="Primary Paint" />

              <ColorSwatchGrid
                presets={PAINT_PRESETS}
                currentHex={paint.primary}
                onSelect={handlePrimaryPaint}
              />

              {/* Custom colour input */}
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-stone-400 font-medium whitespace-nowrap">Custom</label>
                <input
                  type="color"
                  value={paint.primary}
                  onChange={(e) => handlePrimaryPaint(e.target.value)}
                  className="h-7 w-10 rounded-md border border-stone-200 cursor-pointer p-0.5"
                  title="Pick a custom paint colour"
                />
                <input
                  type="text"
                  value={paint.primary.toUpperCase()}
                  onChange={(e) => { if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) handlePrimaryPaint(e.target.value); }}
                  className="flex-1 h-7 px-2 text-[11px] font-mono border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:border-[#e0564d]"
                  maxLength={7}
                />
              </div>

              <div className="space-y-2.5 pt-1 border-t border-[#f2ebd9]">
                <SliderRow label="Metalness" value={paint.metalness ?? 0.15} onChange={handleMetalness} />
                <SliderRow label="Roughness" value={paint.roughness ?? 0.28} onChange={handleRoughness} />
                <SliderRow label="Clearcoat" value={paint.clearcoat ?? 0.8} onChange={handleClearcoat} />
              </div>

              {/* Debug: which material names are being targeted */}
              <div className="pt-1 border-t border-[#f2ebd9]">
                <p className="text-[9px] text-stone-300 font-mono">
                  → {capabilities.paint.targetMaterialNames.join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* ── ACCENT PAINT ─────────────────────────────────────────────── */}
          {capabilities.accentPaint.supported && (
            <div className="bg-white rounded-2xl border border-[#e8e2d5] p-4 shadow-sm space-y-3">
              <SectionHeader icon={<CircleDot size={13} />} label="Accent Colour" />
              <ColorSwatchGrid
                presets={PAINT_PRESETS}
                currentHex={paint.secondary}
                onSelect={handleAccentPaint}
              />
              <div className="pt-1 border-t border-[#f2ebd9]">
                <p className="text-[9px] text-stone-300 font-mono">
                  → {capabilities.accentPaint.targetMaterialNames.join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* ── WHEEL RIMS ───────────────────────────────────────────────── */}
          {capabilities.rims.supported && (
            <div className="bg-white rounded-2xl border border-[#e8e2d5] p-4 shadow-sm space-y-3">
              <SectionHeader icon={<Disc3 size={13} />} label="Wheel Finish" />
              <ColorSwatchGrid
                presets={RIM_PRESETS}
                currentHex={vehicleCustomization.wheels?.rimColor}
                onSelect={handleRimColor}
              />
              <div className="pt-1 border-t border-[#f2ebd9]">
                <p className="text-[9px] text-stone-300 font-mono">
                  → {capabilities.rims.targetMaterialNames.join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* ── GLASS TINT ───────────────────────────────────────────────── */}
          {capabilities.glass.supported && (
            <div className="bg-white rounded-2xl border border-[#e8e2d5] p-4 shadow-sm space-y-3">
              <SectionHeader icon={<Glasses size={13} />} label="Window Tint" />
              <OptionChips<GlassTint>
                options={[
                  { value: "none", label: "Clear" },
                  { value: "light", label: "Light" },
                  { value: "medium", label: "Medium" },
                  { value: "dark", label: "Dark" },
                ]}
                current={vehicleCustomization.glass?.tint}
                onSelect={handleGlassTint}
              />
              <div className="pt-1 border-t border-[#f2ebd9]">
                <p className="text-[9px] text-stone-300 font-mono">
                  → {capabilities.glass.targetMaterialNames.join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* ── TRIM FINISH ──────────────────────────────────────────────── */}
          {capabilities.trim.supported && (
            <div className="bg-white rounded-2xl border border-[#e8e2d5] p-4 shadow-sm space-y-3">
              <SectionHeader icon={<CircleDot size={13} />} label="Exterior Trim" />
              <OptionChips<TrimFinish>
                options={[
                  { value: "chrome", label: "Chrome" },
                  { value: "gloss-black", label: "Gloss Black" },
                  { value: "matte-black", label: "Matte Black" },
                  { value: "body-color", label: "Body Colour" },
                ]}
                current={vehicleCustomization.trim?.finish}
                onSelect={handleTrimFinish}
              />
              <div className="pt-1 border-t border-[#f2ebd9]">
                <p className="text-[9px] text-stone-300 font-mono">
                  → {capabilities.trim.targetMaterialNames.join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* ── LIGHTS ───────────────────────────────────────────────────── */}
          {capabilities.lights.supported && (
            <div className="bg-white rounded-2xl border border-[#e8e2d5] p-4 shadow-sm space-y-3">
              <SectionHeader icon={<Lightbulb size={13} />} label="Lighting" />
              <OptionChips<HeadlightStyle>
                options={[
                  { value: "standard", label: "Standard" },
                  { value: "cool-white", label: "Cool White" },
                  { value: "warm-white", label: "Warm White" },
                ]}
                current={vehicleCustomization.lights?.headlightStyle}
                onSelect={handleHeadlightStyle}
              />
              <div className="pt-1 border-t border-[#f2ebd9]">
                <p className="text-[9px] text-stone-300 font-mono">
                  → {capabilities.lights.targetMaterialNames.join(", ")}
                </p>
              </div>
            </div>
          )}

        </div>
      )}

      <ActionFooter isDirty={isDirty} isSaved={isSaved} onSave={onSave} onDiscard={onDiscard} />
    </div>
  );
};
