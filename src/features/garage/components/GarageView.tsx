"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Cpu,
  Gauge,
  Layers,
  Sparkles,
  Zap,
  Trash2,
  Wrench,
  Car,
} from "lucide-react";
import { getVehicleCatalogItem } from "@/core/domain/vehicleCatalog";
import { Garage3DPreview } from "./Garage3DPreview";
import { getSavedVehicleBuilds, deleteSavedVehicleBuild, type SavedVehicleBuild } from "@/core/state/savedBuilds";
import { Navbar } from "@/components/layout/Navbar";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";

export const GarageView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buildIdFromUrl = searchParams.get("id");

  const [savedBuilds, setSavedBuilds] = useState<SavedVehicleBuild[]>([]);
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null);
  const [buildToDelete, setBuildToDelete] = useState<SavedVehicleBuild | null>(null);

  useEffect(() => {
    const builds = getSavedVehicleBuilds();
    setSavedBuilds(builds);

    if (builds.length > 0) {
      // Check if buildIdFromUrl exists in savedBuilds
      const matchingBuild = buildIdFromUrl ? builds.find((b) => b.id === buildIdFromUrl) : null;
      if (matchingBuild) {
        setSelectedBuildId(matchingBuild.id);
      } else {
        // Fallback gracefully to first saved build
        setSelectedBuildId(builds[0].id);
      }
    }
  }, [buildIdFromUrl]);

  const handleSelectBuild = (id: string) => {
    setSelectedBuildId(id);
    router.replace(`/garage?id=${id}`, { scroll: false });
  };

  const selectedBuild = savedBuilds.find((b) => b.id === selectedBuildId) || savedBuilds[0] || null;
  const selectedBaseVehicle = selectedBuild ? getVehicleCatalogItem(selectedBuild.baseVehicleId) : null;

  const handleOpenSavedBuild = (build: SavedVehicleBuild) => {
    router.push(`/build?vehicle=${build.baseVehicleId}&buildId=${build.id}`);
  };

  const handleTestSavedBuild = (build: SavedVehicleBuild) => {
    router.push(`/test?buildId=${build.id}&vehicle=${build.baseVehicleId}`);
  };

  const onRequestDelete = (e: React.MouseEvent, build: SavedVehicleBuild) => {
    e.stopPropagation();
    setBuildToDelete(build);
  };

  const confirmDeleteBuild = () => {
    if (!buildToDelete) return;
    const id = buildToDelete.id;
    setBuildToDelete(null);
    const updated = deleteSavedVehicleBuild(id);
    setSavedBuilds(updated);
    if (selectedBuildId === id) {
      if (updated.length > 0) {
        setSelectedBuildId(updated[0].id);
        router.replace(`/garage?id=${updated[0].id}`, { scroll: false });
      } else {
        setSelectedBuildId(null);
        router.replace("/garage", { scroll: false });
      }
    }
  };

  return (
    <div className="relative min-h-screen lg:h-[100dvh] lg:max-h-[100dvh] w-full bg-[#f4f6f9] text-slate-900 font-sans flex flex-col justify-between p-4 md:p-5 overflow-y-auto lg:overflow-hidden">
      {/* Top Header Navigation */}
      <Navbar />


      {/* Main Workspace Layout */}
      {savedBuilds.length > 0 && selectedBuild && selectedBaseVehicle ? (
        <>
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            {/* Large 3D Vehicle Hero Viewport */}
            <div className="lg:col-span-8 h-[400px] sm:h-[480px] lg:h-[540px] relative rounded-3xl overflow-hidden esf-panel p-2 bg-white border border-slate-200 shadow-sm flex flex-col">
              <div className="flex-1 w-full h-full relative">
                <Garage3DPreview
                  buildId={selectedBuild.id}
                  modelPath={selectedBaseVehicle.modelPath}
                  vehicleName={selectedBuild.name}
                  materialOverrides={selectedBuild.materialOverrides}
                />

                {/* Badge overlay on top of 3D preview */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                  <Sparkles size={14} className="text-[#f95738]" />
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">{selectedBaseVehicle.type}</span>
                </div>
              </div>
            </div>

            {/* Selected Saved Build Details Panel */}
            <div className="lg:col-span-4 flex flex-col justify-between esf-panel p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f95738] bg-[#f95738]/10 px-2.5 py-1 rounded-md border border-[#f95738]/20">
                    Saved Build
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{selectedBuild.savedAt}</span>
                </div>

                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-1">
                  {selectedBuild.name}
                </h2>
                <p className="text-xs font-mono text-[#f95738] mb-3">Base Model: {selectedBaseVehicle.name}</p>

                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  {selectedBaseVehicle.description}
                </p>

                {/* Customizations summary */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Customization Highlights
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Configured Parts</span>
                    <span className="text-[#f95738] font-mono">{Object.keys(selectedBuild.materialOverrides || {}).length} parts</span>
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="space-y-3 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Base Vehicle Specifications
                  </span>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                        <Cpu size={14} />
                        <span className="text-[10px] font-semibold uppercase">Powertrain</span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-800 block truncate">{selectedBaseVehicle.specs.engine}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                        <Zap size={14} />
                        <span className="text-[10px] font-semibold uppercase">Output</span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-800 block">{selectedBaseVehicle.specs.power}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                        <Gauge size={14} />
                        <span className="text-[10px] font-semibold uppercase">Weight</span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-800 block">{selectedBaseVehicle.specs.weight}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                        <Layers size={14} />
                        <span className="text-[10px] font-semibold uppercase">Drivetrain</span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-800 block truncate">{selectedBaseVehicle.specs.drivetrain}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
                <button
                  type="button"
                  onClick={() => handleOpenSavedBuild(selectedBuild)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#f95738] hover:bg-[#e0482b] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-[0.99] group cursor-pointer"
                >
                  <span>Open Build Workspace</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={() => handleTestSavedBuild(selectedBuild)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-[0.99] group cursor-pointer border border-stone-800"
                >
                  <Zap size={15} className="text-[#f95738]" />
                  <span>Test Vehicle</span>
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1 text-stone-400 group-hover:text-white" />
                </button>

                <button
                  type="button"
                  onClick={(e) => onRequestDelete(e, selectedBuild)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors shadow-xs cursor-pointer self-end sm:self-auto"
                  title="Delete Saved Build"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Saved Custom Builds Grid */}
          <section className="w-full shrink-0">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Wrench size={14} className="text-[#f95738]" />
                  SAVED CUSTOM BUILDS
                </h3>
                <span className="text-xs font-bold text-[#f95738] bg-[#f95738]/10 px-2 py-0.5 rounded-full font-mono">
                  {savedBuilds.length} Saved
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">Click a build card to view, test or edit</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-2">
              {savedBuilds.map((build) => {
                const baseCatalog = getVehicleCatalogItem(build.baseVehicleId);
                const customCount = Object.keys(build.materialOverrides || {}).length;
                const isSelected = build.id === selectedBuild.id;

                return (
                  <div
                    key={build.id}
                    onClick={() => handleSelectBuild(build.id)}
                    className={`cursor-pointer text-left p-4 rounded-2xl transition-all border bg-white flex flex-col justify-between group ${isSelected
                      ? "border-[#f95738] shadow-md ring-2 ring-[#f95738]/20"
                      : "border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#f95738]/10 text-[#f95738] px-2 py-0.5 rounded-full">
                          Customized Build
                        </span>
                        <button
                          type="button"
                          onClick={(e) => onRequestDelete(e, build)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-50 cursor-pointer"
                          title="Delete Build"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <h4 className="text-sm font-extrabold text-slate-900 truncate mb-1">{build.name}</h4>
                      <p className="text-[11px] text-slate-500 font-mono mb-2">Base: {baseCatalog.name}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 gap-2">
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{build.savedAt}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestSavedBuild(build);
                          }}
                          className="text-stone-900 hover:text-[#f95738] font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 bg-stone-100 hover:bg-stone-200/80 px-2.5 py-1 rounded-xl transition-colors cursor-pointer border border-stone-200/60"
                          title="Test this custom build"
                        >
                          <Zap size={12} className="text-[#f95738]" />
                          <span>Test</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSavedBuild(build);
                          }}
                          className="text-stone-900 font-bold text-[11px] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform hover:cursor-pointer hover:text-[#f95738]"
                        >
                          <span>{customCount} parts</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm my-6">
          <div className="h-16 w-16 rounded-3xl bg-[#f95738]/10 border border-[#f95738]/20 flex items-center justify-center text-[#f95738] mb-4 shadow-sm">
            <Wrench size={32} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Your Garage is Empty</h2>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-6">
            You haven't saved any custom vehicle builds yet. Select a base model in the Build section to start customizing and save your design!
          </p>
          <button
            type="button"
            onClick={() => router.push("/build")}
            className="flex items-center gap-2 py-3 px-6 rounded-2xl bg-[#f95738] hover:bg-[#e0482b] hover:cursor-pointer text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-md active:scale-[0.98]"
          >
            <Car size={16} />
            <span>Explore Base Vehicles</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={Boolean(buildToDelete)}
        vehicleName={buildToDelete?.name || ""}
        onClose={() => setBuildToDelete(null)}
        onConfirm={confirmDeleteBuild}
      />
    </div>
  );
};
