"use client";

import React, { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Box,
  CheckCircle2,
  Layers,
  Sliders,
  X,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { AnatomyViewer } from "@/viewer/AnatomyViewer";
import { useVehicleStore, getPartByMeshName, VEHICLE_PARTS_DATA, isOverridesDirty } from "@/core/state/useVehicleStore";
import { getVehicleCatalogItem } from "@/core/domain/vehicleCatalog";
import { PartInspectorPanel } from "./PartInspectorPanel";
import { AssemblyTreePanel } from "./AssemblyTreePanel";
import { BuildCatalogView } from "./BuildCatalogView";
import { Navbar } from "@/components/layout/Navbar";
import { getSavedVehicleBuilds, saveVehicleBuild, type SavedVehicleBuild } from "@/core/state/savedBuilds";
import type { PartMaterialConfig } from "@/core/domain/vehicle";

// ─────────────────────────────────────────────
// BUILD WORKSPACE CONTENT
// ─────────────────────────────────────────────
function BuildWorkspaceContent({ vehicleParam }: { vehicleParam: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buildIdParam = searchParams.get("buildId");

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

  // Mobile drawer state
  const [mobileDrawer, setMobileDrawer] = useState<"none" | "components" | "inspector">("none");

  const {
    setSelectedMesh,
    setHoveredMesh,
    selectedMeshName,
    selectedPart,
    hoveredMeshName,
    materialOverrides,
    setMaterialOverrides,
    setAvailableMeshNames,
  } = useVehicleStore();

  const hoveredPart = getPartByMeshName(hoveredMeshName);
  const savedOverridesRef = useRef<Record<string, Partial<PartMaterialConfig>>>({});

  // ── Init viewer ──────────────────────────────
  useEffect(() => {
    setAvailableMeshNames([]);
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
  }, [activeCatalogItem.modelPath, setSelectedMesh, setHoveredMesh, setAvailableMeshNames]);

  // ── Sync buildId / vehicle searchParam / Initial overrides ──
  useEffect(() => {
    setSelectedMesh(null);
    if (buildIdParam) {
      const savedBuilds = getSavedVehicleBuilds();
      const existing = savedBuilds.find((b) => b.id === buildIdParam);
      if (existing && existing.materialOverrides) {
        console.log(`[Workspace Init] Vehicle: ${activeCatalogItem.id}, ModelPath: ${activeCatalogItem.modelPath}, Saved Customization: YES (ID: ${existing.id}), Overrides:`, existing.materialOverrides);
        setMaterialOverrides(existing.materialOverrides);
        savedOverridesRef.current = { ...existing.materialOverrides };
        return;
      }
    }
    // If no buildId param, initialize empty overrides baseline
    console.log(`[Workspace Init] Vehicle: ${activeCatalogItem.id}, ModelPath: ${activeCatalogItem.modelPath}, Saved Customization: NO, Baseline: ORIGINAL GLB`);
    setMaterialOverrides({});
    savedOverridesRef.current = {};
  }, [buildIdParam, vehicleParam, activeCatalogItem, setSelectedMesh, setMaterialOverrides]);

  const isDirty = isOverridesDirty(materialOverrides, savedOverridesRef.current);

  // ── Sync panel → viewer selection ────────────
  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.selectMesh(selectedMeshName);
    }
  }, [selectedMeshName]);

  // ── Re-apply material overrides & sync available mesh names after viewer finishes loading ──
  useEffect(() => {
    if (!loading && viewerRef.current) {
      const loadedMeshNames = viewerRef.current.getLoadedMeshNames();
      setAvailableMeshNames(loadedMeshNames);

      Object.entries(materialOverrides).forEach(([meshName, config]) => {
        viewerRef.current?.updateMaterial(meshName, config);
      });
    }
  }, [loading, materialOverrides, setAvailableMeshNames]);

  // ── Material update handler ──────────────────
  const handleUpdateMaterial = useCallback(
    (meshName: string, config: { color?: string; roughness?: number; metalness?: number; opacity?: number; wireframe?: boolean }) => {
      viewerRef.current?.updateMaterial(meshName, config);
    },
    []
  );

  // ── Save to Garage action ────────────────────
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
    };

    saveVehicleBuild(newBuild);
    savedOverridesRef.current = { ...materialOverrides };
    setNotification("Build saved to Garage!");
    setIsSaved(true);

    // Revert button state after 2 seconds
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);

    // Clear toast notification after 2.5s
    setTimeout(() => {
      setNotification(null);
    }, 2500);
  };

  // ── Discard action ───────────────────────────
  const handleDiscard = () => {
    const saved = savedOverridesRef.current;
    setMaterialOverrides(saved);

    // Revert all parts on 3D viewer live
    if (viewerRef.current) {
      VEHICLE_PARTS_DATA.forEach((part) => {
        const override = saved[part.meshName] ?? part.defaultMaterial;
        viewerRef.current?.updateMaterial(part.meshName, override);
      });
    }

    setNotification("Customizations discarded.");
    setTimeout(() => {
      setNotification(null);
    }, 2500);
  };

  // ── Toolbar actions ──────────────────────────
  const handleZoomIn = () => viewerRef.current?.zoom(-1);
  const handleZoomOut = () => viewerRef.current?.zoom(1);
  const handleReset = () => {
    viewerRef.current?.resetView();
    setSelectedMesh(null);
  };

  return (
    /* Root: full screen, column flex, no scroll */
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", width: "100vw", overflow: "hidden", background: "#f7f4ed", color: "#1c1917", fontFamily: "var(--font-sans)" }}>

      {/* ── HEADER ───────────────────────────────── */}
      <header style={{ height: "56px", minHeight: "56px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "1px solid #e8e2d5", background: "#f7f4ed", zIndex: 30 }}>
        {/* Left: back button + vehicle name + active component pill */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/build")}
            className="h-8 w-8 rounded-full bg-white border border-[#e8e2d5] flex items-center justify-center text-stone-500 hover:text-[#e0564d] hover:border-[#e0564d] transition-colors shadow-sm"
            title="Return to Vehicle Selection"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Build Workspace</span>
            <h1 className="text-sm font-extrabold text-stone-900 leading-tight">{activeCatalogItem.name}</h1>
          </div>

          {selectedPart && (
            <div className="flex items-center gap-2 bg-white border border-[#e8e2d5] rounded-full px-3 py-1 shadow-sm ml-2">
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
        <Navbar />
      </header>

      {/* ── MAIN 3-COLUMN LAYOUT ─────────────────── */}
      {/* style guarantees: flex row fills all remaining height, never scrolls */}
      <main style={{ flex: 1, display: "flex", flexDirection: "row", overflow: "hidden", minHeight: 0 }}>

        {/* LEFT: Components — always visible on desktop, hidden on mobile */}
        <aside
          className="hidden lg:flex"
          style={{ width: "272px", minWidth: "272px", flexShrink: 0, flexDirection: "column", borderRight: "1px solid #e8e2d5", background: "#f7f4ed", overflow: "hidden" }}
        >
          <AssemblyTreePanel />
        </aside>

        {/* CENTER: 3D Viewport — takes all remaining horizontal space */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: "relative", overflow: "hidden", background: "#f2ebd9" }}>
          {/* WebGL canvas mount — absolutely fills the relative parent */}
          <div
            ref={mountRef}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          />

          {/* Hover name chip — top-left */}
          {(hoveredPart && !selectedPart) && (
            <div className="absolute top-3 left-3 z-20 pointer-events-none animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center gap-2 bg-stone-900/85 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl border border-stone-700/60 shadow-md text-xs font-semibold">
                <span className="text-[#f5a623]">◈</span>
                {hoveredPart.name}
              </div>
            </div>
          )}

          {/* Toast Notification Banner */}
          {notification && (
            <div className="absolute top-3 right-3 z-30 bg-stone-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-stone-700">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>{notification}</span>
            </div>
          )}
        </div>

        {/* RIGHT: Inspector — always visible on desktop, hidden on mobile */}
        <aside
          className="hidden lg:flex"
          style={{ width: "312px", minWidth: "312px", flexShrink: 0, flexDirection: "column", borderLeft: "1px solid #e8e2d5", background: "#f7f4ed", overflow: "hidden" }}
        >
          <PartInspectorPanel
            onUpdateMaterial={handleUpdateMaterial}
            onSave={handleSaveToGarage}
            onDiscard={handleDiscard}
            isSaved={isSaved}
            isDirty={isDirty}
          />
        </aside>
      </main>

      {/* ── MOBILE BOTTOM TOOLBAR ─────────────────── */}
      <div className="md:hidden shrink-0 flex border-t border-[#e8e2d5] bg-[#f7f4ed] z-30">
        <button
          type="button"
          onClick={() => setMobileDrawer(mobileDrawer === "components" ? "none" : "components")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors ${mobileDrawer === "components"
            ? "text-[#e0564d] bg-[#fef2f2]"
            : "text-stone-600 hover:text-stone-900"
            }`}
        >
          <Layers size={16} />
          <span>Components</span>
        </button>
        <div className="w-px bg-[#e8e2d5]" />
        <button
          type="button"
          onClick={() => setMobileDrawer(mobileDrawer === "inspector" ? "none" : "inspector")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors ${mobileDrawer === "inspector"
            ? "text-[#e0564d] bg-[#fef2f2]"
            : "text-stone-600 hover:text-stone-900"
            }`}
        >
          <Sliders size={16} />
          <span>Inspector</span>
          {selectedPart && (
            <span className="h-2 w-2 rounded-full bg-[#e0564d] ml-1" />
          )}
        </button>
      </div>

      {/* ── MOBILE DRAWERS ────────────────────────── */}
      {mobileDrawer !== "none" && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          onClick={() => setMobileDrawer("none")}
        >
          <div className="absolute inset-0 bg-stone-900/20" />
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[70vh] rounded-t-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {mobileDrawer === "components" && <AssemblyTreePanel />}
            {mobileDrawer === "inspector" && (
              <PartInspectorPanel
                onUpdateMaterial={handleUpdateMaterial}
                onSave={handleSaveToGarage}
                onDiscard={handleDiscard}
                isSaved={isSaved}
                isDirty={isDirty}
              />
            )}
          </div>
        </div>
      )}

      {/* ── LOADING OVERLAY ──────────────────────── */}
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

// ─────────────────────────────────────────────
// ROUTE SWITCHER
// ─────────────────────────────────────────────
function VehicleViewerContent() {
  const searchParams = useSearchParams();
  const vehicleParam = searchParams.get("vehicle");

  if (!vehicleParam) {
    return <BuildCatalogView />;
  }

  return <BuildWorkspaceContent vehicleParam={vehicleParam} />;
}

// ─────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────
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

