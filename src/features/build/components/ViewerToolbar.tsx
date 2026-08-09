"use client";

import React, { useState } from "react";
import {
  RotateCcw,
  ZoomIn,
  Eye,
  Scissors,
  Layers,
  Columns,
  RotateCw,
  Target,
  Maximize2,
} from "lucide-react";
import { useVehicleStore } from "@/core/state/useVehicleStore";
import type { ViewPreset } from "@/core/domain/vehicle";

interface ViewerToolbarProps {
  onTool: (tool: string) => void;
  onSelectPresetView: (preset: ViewPreset) => void;
  onFocusSelected: () => void;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  onTool,
  onSelectPresetView,
  onFocusSelected,
}) => {
  const { autoRotate, setAutoRotate, selectedMeshName } = useVehicleStore();
  const [isolated, setIsolated] = useState(false);
  const [crossSection, setCrossSection] = useState(false);
  const [wireframe, setWireframe] = useState(false);

  const tools = [
    {
      id: "rotate",
      label: "Rotate",
      icon: <RotateCw size={18} />,
      active: autoRotate,
      action: () => {
        setAutoRotate(!autoRotate);
        onTool("rotate");
      },
    },
    {
      id: "zoom",
      label: "Zoom",
      icon: <ZoomIn size={18} />,
      active: false,
      action: () => onTool("zoom-in"),
    },
    {
      id: "isolate",
      label: "Isolate",
      icon: <Eye size={18} />,
      active: isolated,
      action: () => {
        setIsolated(!isolated);
        onTool("isolate");
      },
    },
    {
      id: "cross-section",
      label: "Cross-section",
      icon: <Scissors size={18} />,
      active: crossSection,
      action: () => {
        setCrossSection(!crossSection);
        onTool("cross-section");
      },
    },
    {
      id: "layers",
      label: "Layers",
      icon: <Layers size={18} />,
      active: wireframe,
      action: () => {
        setWireframe(!wireframe);
        onTool("wireframe");
      },
    },
    {
      id: "compare",
      label: "Focus",
      icon: <Target size={18} />,
      active: false,
      disabled: !selectedMeshName,
      action: onFocusSelected,
    },
    {
      id: "reset",
      label: "Reset",
      icon: <RotateCcw size={18} />,
      active: false,
      action: () => {
        setIsolated(false);
        setCrossSection(false);
        setWireframe(false);
        onTool("reset");
      },
    },
  ];

  return (
    <div className="atelier-card flex flex-col items-center gap-1.5 p-2 bg-white/90 backdrop-blur-md rounded-2xl border border-[#e8e2d5] shadow-md text-stone-700">
      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          onClick={tool.action}
          disabled={tool.disabled}
          className={`w-14 h-13 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[9px] font-semibold transition-all ${
            tool.disabled
              ? "opacity-30 cursor-not-allowed text-stone-400"
              : tool.active
              ? "bg-[#e0564d] text-white shadow-sm"
              : "text-stone-600 hover:bg-[#f5f0e6] hover:text-stone-900"
          }`}
          title={tool.label}
        >
          {tool.icon}
          <span className="tracking-tight leading-none scale-90">{tool.label}</span>
        </button>
      ))}
    </div>
  );
};

