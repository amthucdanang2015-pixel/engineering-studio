"use client";

import React, { useEffect, useRef, useState } from "react";
import type { AnatomyViewer } from "@/viewer/AnatomyViewer";
import { getPartByMeshName } from "@/core/state/useVehicleStore";

interface BuildDotsOverlayProps {
  viewerRef: React.RefObject<AnatomyViewer | null>;
  /** Exact selectable GLB mesh IDs from the existing component list. */
  componentIds: string[];
  /** The existing component-list selection state. */
  selectedComponentId: string | null;
  /** The same selection handler used by the existing component list. */
  onSelectComponent: (componentId: string) => void;
  modelLoaded: boolean;
}

const DOT_COLORS = ["#e0564d", "#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e", "#ec4899", "#06b6d4"];

/**
 * Visual shortcuts for existing component-list entries. There is intentionally
 * no semantic grouping, GLB-name interpretation, or independent dot state:
 * every dot is keyed by, labelled from, and selected through the exact mesh ID
 * already used by the car's component-selection system.
 */
export const BuildDotsOverlay: React.FC<BuildDotsOverlayProps> = ({
  viewerRef,
  componentIds,
  selectedComponentId,
  onSelectComponent,
  modelLoaded,
}) => {
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);
  const frameRef = useRef<number | null>(null);
  const dotElementsRef = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    if (!modelLoaded || componentIds.length === 0) return;

    const update = () => {
      const viewer = viewerRef.current;
      if (viewer) {
        for (const componentId of componentIds) {
          const element = dotElementsRef.current.get(componentId);
          if (!element) continue;

          const anchor = viewer.getMeshAnchor(componentId);
          if (!anchor) {
            element.style.visibility = "hidden";
            continue;
          }

          const position = viewer.projectVehicleLocalToScreen(anchor.x, anchor.y, anchor.z);
          const isVisible = !position.behindCamera && position.x >= 0 && position.x <= 100 && position.y >= 0 && position.y <= 100;
          element.style.visibility = isVisible ? "visible" : "hidden";
          if (isVisible) {
            element.style.left = `${position.x}%`;
            element.style.top = `${position.y}%`;
          }
        }
      }
      frameRef.current = requestAnimationFrame(update);
    };

    frameRef.current = requestAnimationFrame(update);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [componentIds, modelLoaded, viewerRef]);

  if (!modelLoaded || componentIds.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 15 }}>
      {componentIds.map((componentId, index) => {
        const part = getPartByMeshName(componentId);
        // A stale ID with no existing selectable component must never render.
        if (!part) return null;

        const isSelected = selectedComponentId === componentId;
        const isHovered = hoveredComponentId === componentId;
        const color = DOT_COLORS[index % DOT_COLORS.length];
        return (
          <div
            key={componentId}
            className="absolute pointer-events-auto"
            ref={(element) => {
              if (element) dotElementsRef.current.set(componentId, element);
              else dotElementsRef.current.delete(componentId);
            }}
            style={{ transform: "translate(-50%, -50%)", visibility: "hidden" }}
          >
            {isHovered && (
              <span className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900/90 px-2 py-1 text-[10px] font-bold text-white shadow-lg">
                {part.name}
              </span>
            )}
            <button
              type="button"
              aria-label={`Select ${part.name}`}
              aria-pressed={isSelected}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onSelectComponent(componentId);
              }}
              onMouseEnter={() => setHoveredComponentId(componentId)}
              onMouseLeave={() => setHoveredComponentId(null)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-transparent p-0 outline-none"
            >
              <span
                className="block rounded-full border-2 border-white transition-transform duration-150"
                style={{
                  width: isSelected || isHovered ? 16 : 12,
                  height: isSelected || isHovered ? 16 : 12,
                  backgroundColor: color,
                  boxShadow: isSelected
                    ? `0 0 0 3px ${color}66, 0 2px 8px rgba(0,0,0,0.35)`
                    : "0 2px 6px rgba(0,0,0,0.35)",
                }}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
};
