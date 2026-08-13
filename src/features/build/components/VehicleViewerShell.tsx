"use client";

import React, { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Box,
  CheckCircle2,
  X,
} from "lucide-react";
import { AnatomyViewer } from "@/viewer/AnatomyViewer";
import {
  useVehicleStore,
  getPartByMeshName,
  isOverridesDirty,
  isCustomizationDirty,
} from "@/core/state/useVehicleStore";
import { getVehicleCatalogItem } from "@/core/domain/vehicleCatalog";
import { PartInspectorPanel } from "./PartInspectorPanel";
import { BuildCatalogView } from "./BuildCatalogView";
import { Navbar } from "@/components/layout/Navbar";
import { getSavedVehicleBuilds, saveVehicleBuild, type SavedVehicleBuild } from "@/core/state/savedBuilds";
import { DEFAULT_VEHICLE_CUSTOMIZATION } from "@/core/domain/vehicleCustomization";
import { EMPTY_VEHICLE_CAPABILITIES } from "@/core/domain/vehicleCapabilities";
import { useGlbCustomization } from "../hooks/useGlbCustomization";
import type { PartMaterialConfig } from "@/core/domain/vehicle";
import type { VehicleCustomization } from "@/core/domain/vehicleCustomization";

import { VehicleLibrarySheet } from "./VehicleLibrarySheet";
import { BuildOnboardingHint } from "./BuildOnboardingHint";

// ─────────────────────────────────────────────────────────────────────────────
// BUILD WORKSPACE CONTENT
// ─────────────────────────────────────────────────────────────────────────────
function BuildWorkspaceContent({ vehicleParam }: { vehicleParam: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buildIdParam = searchParams.get("buildId");
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const activeCatalogItem = getVehicleCatalogItem(vehicleParam);

  const mountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<AnatomyViewer | null>(null);

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [currentBuildId, setCurrentBuildId] = useState<string | null>(buildIdParam);

  // Sync currentBuildId when buildIdParam changes
  useEffect(() => {
    if (buildIdParam) {
      setCurrentBuildId(buildIdParam);
    }
  }, [buildIdParam]);

  const {
    setSelectedMesh,
    setHoveredMesh,
    selectedMeshName,
    selectedPart,
    hoveredMeshName,
    materialOverrides,
    vehicleCustomization,
    vehicleCapabilities,
    setMaterialOverrides,
    setMaterialInventory,
    setAvailableMeshNames,
    setVehicleCustomization,
    setVehicleCapabilities,
    resetVehicleCustomization,
  } = useVehicleStore();

  const hoveredPart = getPartByMeshName(hoveredMeshName);

  /** Saved baseline refs — used for dirty checking and discard */
  const savedOverridesRef = useRef<Record<string, Partial<PartMaterialConfig>>>({});
  const savedCustomizationRef = useRef<VehicleCustomization>(DEFAULT_VEHICLE_CUSTOMIZATION);

  // ── Wire the semantic customization adapter ─────────────────────────────────
  // The adapter reads capabilities from the store — no vehicle ID, no hardcoded maps
  useGlbCustomization(viewerRef, vehicleCapabilities, vehicleCustomization, loading);

  // ── Init viewer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setAvailableMeshNames([]);
    setMaterialInventory([]);
    setVehicleCapabilities(EMPTY_VEHICLE_CAPABILITIES);
    if (!mountRef.current) return;
    let viewer: AnatomyViewer | null = null;

    viewer = new AnatomyViewer(mountRef.current, {
      mode: "build",
      onSelect: (_, meshName) => setSelectedMesh(meshName),
      onHover: (_, meshName) => setHoveredMesh(meshName),
      onLoading: (isLoading, val) => {
        setLoading(isLoading);
        setProgress(val);
      },
    });

    viewerRef.current = viewer;
    viewer.setAutoRotate(true);

    viewer.setVehicleModel(activeCatalogItem.modelPath).catch(() => {
      setLoading(false);
      setProgress(0);
    });

    return () => {
      viewerRef.current = null;
      viewer?.dispose();
    };
  }, [activeCatalogItem.modelPath, setSelectedMesh, setHoveredMesh, setAvailableMeshNames, setMaterialInventory, setVehicleCapabilities]);

  // ── Sync buildId / vehicle param / Initial customization state ──────────────
  useEffect(() => {
    setSelectedMesh(null);

    if (buildIdParam) {
      const savedBuilds = getSavedVehicleBuilds();
      const existing = savedBuilds.find((b) => b.id === buildIdParam);
      if (existing) {
        // Restore saved semantic customization
        if (existing.vehicleCustomization) {
          setVehicleCustomization(existing.vehicleCustomization);
          savedCustomizationRef.current = existing.vehicleCustomization;
        }
        // Restore legacy mesh overrides if present
        if (existing.materialOverrides) {
          setMaterialOverrides(existing.materialOverrides);
          savedOverridesRef.current = { ...existing.materialOverrides };
        }
        return;
      }
    }

    // No saved build — reset to defaults
    setVehicleCustomization(DEFAULT_VEHICLE_CUSTOMIZATION);
    savedCustomizationRef.current = DEFAULT_VEHICLE_CUSTOMIZATION;
    setMaterialOverrides({});
    savedOverridesRef.current = {};
  }, [buildIdParam, vehicleParam, activeCatalogItem, setSelectedMesh, setMaterialOverrides, setVehicleCustomization]);

  // ── Sync mesh names + material inventory + capabilities after model loads ───────
  useEffect(() => {
    if (!loading && viewerRef.current) {
      const loadedMeshNames = viewerRef.current.getLoadedMeshNames();
      setAvailableMeshNames(loadedMeshNames);

      const inventory = viewerRef.current.getMaterialInventory();
      setMaterialInventory(inventory);

      // ⭐ Core: read the GlbAnalyzer capability report and push to store
      const caps = viewerRef.current.getCapabilities();
      if (caps) {
        setVehicleCapabilities(caps);
        console.log(`[Build] Capabilities for ${activeCatalogItem.id}:`, caps);
      }

      // Re-apply legacy mesh overrides
      Object.entries(materialOverrides).forEach(([meshName, config]) => {
        viewerRef.current?.updateMaterial(meshName, config);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, setAvailableMeshNames, setMaterialInventory, setVehicleCapabilities]);

  // ── Sync panel → viewer selection ────────────────────────────────────────────
  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.selectMesh(selectedMeshName);
    }
  }, [selectedMeshName]);

  // ── Dirty state ──────────────────────────────────────────────────────────────
  const isSemanticDirty = isCustomizationDirty(vehicleCustomization, savedCustomizationRef.current);
  const isOverridesDirtyFlag = isOverridesDirty(materialOverrides, savedOverridesRef.current);
  const isDirty = isSemanticDirty || isOverridesDirtyFlag;

  // ── Legacy per-mesh material update handler (Part Inspector) ─────────────────
  const handleUpdateMaterial = useCallback(
    (meshName: string, config: { color?: string; roughness?: number; metalness?: number; opacity?: number; wireframe?: boolean }) => {
      viewerRef.current?.updateMaterial(meshName, config);
    },
    []
  );

  // ── Save to Garage ────────────────────────────────────────────────────────────
  const handleSaveToGarage = () => {
    const buildId = currentBuildId || buildIdParam || `custom-${activeCatalogItem.id}-${Date.now()}`;
    if (!currentBuildId) {
      setCurrentBuildId(buildId);
    }

    const newBuild: SavedVehicleBuild = {
      id: buildId,
      baseVehicleId: activeCatalogItem.id,
      name: `${activeCatalogItem.name} Custom Build`,
      savedAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      materialOverrides: { ...materialOverrides },
      vehicleCustomization: { ...vehicleCustomization },
    };

    saveVehicleBuild(newBuild);
    savedOverridesRef.current = { ...materialOverrides };
    savedCustomizationRef.current = { ...vehicleCustomization };

    setNotification("Build saved to Garage!");
    setIsSaved(true);

    setTimeout(() => setIsSaved(false), 2000);
    setTimeout(() => setNotification(null), 2500);
  };

  // ── Reset / Discard ───────────────────────────────────────────────────────────
  const handleDiscard = () => {
    // Restore saved semantic customization
    setVehicleCustomization(savedCustomizationRef.current);

    // Restore legacy mesh overrides
    setMaterialOverrides(savedOverridesRef.current);

    // Reset Three.js materials to original GLB state, then re-apply saved state
    viewerRef.current?.resetCustomization();

    // Re-apply any saved legacy per-mesh overrides on the viewer
    Object.entries(savedOverridesRef.current).forEach(([meshName, config]) => {
      viewerRef.current?.updateMaterial(meshName, config);
    });

    setNotification("Customizations reset.");
    setTimeout(() => setNotification(null), 2500);
  };

  const handleSelectVehicleFromSheet = (newVehicleId: string) => {
    router.push(`/build?vehicle=${newVehicleId}`);
  };

  return (
    <div className="relative min-h-screen lg:h-[100dvh] lg:max-h-[100dvh] w-full bg-[#f4f6f9] text-slate-900 font-sans flex flex-col justify-between p-4 md:p-5 overflow-y-auto lg:overflow-hidden">
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <header className="esf-panel w-full flex items-center justify-between rounded-2xl px-5 py-3.5 shadow-sm bg-white/90 backdrop-blur-md border border-slate-200 mb-4 lg:mb-5 shrink-0">
        {/* Left: back button + vehicle name + active component pill */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/build")}
            className="h-8 w-8 rounded-full bg-white border border-[#e8e2d5] flex items-center justify-center text-stone-500 hover:text-[#e0564d] hover:border-[#e0564d] hover:cursor-pointer transition-colors shadow-2xs"
            title="Return to Vehicle Selection"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Build Workspace</span>
            <h1 className="text-xs sm:text-sm font-extrabold text-stone-900 leading-tight">{activeCatalogItem.name}</h1>
          </div>

          {selectedPart && (
            <div className="hidden sm:flex items-center gap-2 bg-white border border-[#e8e2d5] rounded-full px-3 py-1 shadow-2xs ml-2 hover:cursor-pointer hover:bg-[#dbd3d3]">
              <span className="h-2 w-2 rounded-full bg-[#e0564d]" />
              <span className="text-[11px] font-bold text-stone-800 truncate max-w-[160px]">{selectedPart.name}</span>
              <button
                type="button"
                onClick={() => setSelectedMesh(null)}
                className="text-stone-400 hover:text-stone-700 transition-colors ml-1"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Right: Top Navigation */}
        <Navbar onOpenLibrary={() => setIsLibraryOpen(true)} />
      </header>

      {/* ── MAIN WORKSPACE ──────────────────────────────────────── */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-visible lg:overflow-hidden min-h-0">

        {/* 3D Viewport */}
        <div className="w-full lg:flex-1 h-[60vh] min-h-[340px] max-h-[520px] lg:h-full lg:min-h-0 lg:max-h-none relative overflow-hidden bg-[#f2ebd9] touch-pan-y shrink-0 lg:shrink">
          <div
            ref={mountRef}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          />

          {/* First-time onboarding hint — appears after load, gone after first selection */}
          <BuildOnboardingHint
            modelLoaded={!loading}
            partSelected={!!selectedPart}
          />

          {/* Hover name chip */}
          {hoveredPart && !selectedPart && (
            <div className="absolute top-3 left-3 z-20 pointer-events-none animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center gap-2 bg-stone-900/85 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl border border-stone-700/60 shadow-md text-xs font-semibold">
                <span className="text-[#f5a623]">◈</span>
                {hoveredPart.name}
              </div>
            </div>
          )}

          {/* Toast Notification */}
          {notification && (
            <div className="absolute top-3 right-3 z-30 bg-stone-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-stone-700">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>{notification}</span>
            </div>
          )}
        </div>

        {/* DESKTOP INSPECTOR SIDEBAR */}
        <aside
          className="hidden lg:flex"
          style={{ width: "340px", minWidth: "340px", flexShrink: 0, flexDirection: "column", borderLeft: "1px solid #e8e2d5", background: "#f7f4ed", overflow: "hidden" }}
        >
          <PartInspectorPanel
            capabilities={vehicleCapabilities}
            onUpdateMaterial={handleUpdateMaterial}
            onSave={handleSaveToGarage}
            onDiscard={handleDiscard}
            isSaved={isSaved}
            isDirty={isDirty}
          />
        </aside>

        {/* MOBILE / TABLET INSPECTOR */}
        <div className="lg:hidden w-full border-t border-[#e8e2d5] bg-[#f7f4ed] flex flex-col">
          <PartInspectorPanel
            capabilities={vehicleCapabilities}
            onUpdateMaterial={handleUpdateMaterial}
            onSave={handleSaveToGarage}
            onDiscard={handleDiscard}
            isSaved={isSaved}
            isDirty={isDirty}
          />
        </div>
      </main>

      {/* ── MOBILE VEHICLE LIBRARY SHEET ──────────────────────── */}
      <VehicleLibrarySheet
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        selectedVehicleId={activeCatalogItem.id}
        onSelectVehicle={handleSelectVehicleFromSheet}
      />

      {/* ── LOADING OVERLAY ─────────────────────────────────────── */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f7f4ed]/95 backdrop-blur-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e0564d]/10 text-[#e0564d] border border-[#e0564d]/20 mb-4">
            <Box size={28} className="animate-pulse" />
          </div>
          <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider">
            Loading {activeCatalogItem.name}
          </h2>
          <div className="mt-3 w-48 h-1 bg-[#e8e2d5] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#e0564d] rounded-full transition-all duration-300"
              style={{ width: `${Math.max(8, Math.round(progress * 100))}%` }}
            />
          </div>
          <p className="text-xs text-stone-400 mt-2 font-mono">
            {Math.max(8, Math.round(progress * 100))}%
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE SWITCHER
// ─────────────────────────────────────────────────────────────────────────────
function VehicleViewerContent() {
  const searchParams = useSearchParams();
  const vehicleParam = searchParams.get("vehicle");

  if (!vehicleParam) {
    return <BuildCatalogView />;
  }

  return <BuildWorkspaceContent vehicleParam={vehicleParam} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export const VehicleViewerShell: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[#f7f4ed] text-[#1c1917]">
          <div className="flex items-center gap-3">
            <Box size={22} className="animate-spin text-[#e0564d]" />
            <span className="text-sm font-bold">Initializing Build Workspace…</span>
          </div>
        </div>
      }
    >
      <VehicleViewerContent />
    </Suspense>
  );
};
