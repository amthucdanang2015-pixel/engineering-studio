"use client";

import React, { useEffect, useRef, useState } from "react";
import type { AnatomyViewer } from "@/viewer/AnatomyViewer";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** One customization point — one per supported semantic capability. */
export interface CapabilityPoint {
  /** The GLB mesh name used as the 3D anchor AND as the selection target. */
  meshId: string;
  /** Human-readable label shown in the tooltip (derived from the capability name). */
  label: string;
  /** Unique dot colour for this capability. Stable — never changes. */
  color: string;
}

interface BuildDotsOverlayProps {
  viewerRef: React.RefObject<AnatomyViewer | null>;
  /** One point per supported semantic capability. */
  points: CapabilityPoint[];
  /** The mesh currently selected in the store. */
  selectedMeshId: string | null;
  /** The same handler used by the viewer's own click — calls setSelectedMesh. */
  onSelectMesh: (meshId: string) => void;
  modelLoaded: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * BuildDotsOverlay
 *
 * Renders coloured 3D-anchored dots over the vehicle viewport. Each dot
 * corresponds to exactly one semantic capability (paint, glass, rims, etc.)
 * and is anchored to the representative mesh of that capability.
 *
 * Clicking a dot calls the same handler as clicking the vehicle mesh directly,
 * producing identical Inspector / store state.
 */
export const BuildDotsOverlay: React.FC<BuildDotsOverlayProps> = ({
  viewerRef,
  points,
  selectedMeshId,
  onSelectMesh,
  modelLoaded,
}) => {
  const [hoveredMeshId, setHoveredMeshId] = useState<string | null>(null);
  const frameRef = useRef<number | null>(null);
  const dotElementsRef = useRef(new Map<string, HTMLDivElement>());

  // ── Animation loop — projects 3D anchors to screen each frame with separation pass ──
  useEffect(() => {
    if (!modelLoaded || points.length === 0) return;

    const update = () => {
      const viewer = viewerRef.current;
      if (!viewer) {
        frameRef.current = requestAnimationFrame(update);
        return;
      }

      interface ProjectedDot {
        meshId: string;
        element: HTMLDivElement;
        x: number; // screen % (0-100)
        y: number; // screen % (0-100)
      }

      const visibleDots: ProjectedDot[] = [];

      for (const point of points) {
        const element = dotElementsRef.current.get(point.meshId);
        if (!element) continue;

        const anchor = viewer.getMeshAnchor(point.meshId);
        if (!anchor) {
          element.style.visibility = "hidden";
          continue;
        }

        const pos = viewer.projectVehicleLocalToScreen(anchor.x, anchor.y, anchor.z);
        const inView =
          !pos.behindCamera &&
          pos.x >= -4 &&
          pos.x <= 104 &&
          pos.y >= -4 &&
          pos.y <= 104;

        if (inView) {
          visibleDots.push({
            meshId: point.meshId,
            element,
            x: pos.x,
            y: pos.y,
          });
        } else {
          element.style.visibility = "hidden";
        }
      }

      // Dynamic 2D Collision Separation:
      // Prevents overlapping dots (e.g. Tire & Rim on the same wheel) while staying anchored to the 3D target
      const minDistance = 3.6; // percentage of viewport (~35-45px)
      for (let iter = 0; iter < 3; iter++) {
        for (let i = 0; i < visibleDots.length; i++) {
          for (let j = i + 1; j < visibleDots.length; j++) {
            const a = visibleDots[i];
            const b = visibleDots[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy);

            if (dist < minDistance) {
              const overlap = minDistance - dist;
              let nx = dist > 0.001 ? dx / dist : (j % 2 === 0 ? 0.707 : -0.707);
              let ny = dist > 0.001 ? dy / dist : -0.707;
              const len = Math.hypot(nx, ny) || 1;
              nx /= len;
              ny /= len;

              const shift = overlap * 0.5;
              a.x -= nx * shift;
              a.y -= ny * shift;
              b.x += nx * shift;
              b.y += ny * shift;
            }
          }
        }
      }

      // Apply positions to DOM elements
      for (const dot of visibleDots) {
        dot.element.style.visibility = "visible";
        dot.element.style.left = `${dot.x}%`;
        dot.element.style.top = `${dot.y}%`;
      }

      frameRef.current = requestAnimationFrame(update);
    };

    frameRef.current = requestAnimationFrame(update);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [points, modelLoaded, viewerRef]);

  if (!modelLoaded || points.length === 0) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 15 }}
    >
      {points.map((point) => {
        const isSelected = selectedMeshId === point.meshId;
        const isHovered  = hoveredMeshId  === point.meshId;
        const isActive   = isSelected || isHovered;

        return (
          <div
            key={point.meshId}
            className="absolute pointer-events-auto"
            ref={(el) => {
              if (el) dotElementsRef.current.set(point.meshId, el);
              else dotElementsRef.current.delete(point.meshId);
            }}
            style={{ transform: "translate(-50%, -50%)", visibility: "hidden" }}
          >
            {/* Floating label — visible on hover or selection */}
            {isActive && (
              <span
                className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none select-none"
                style={{
                  bottom: "calc(100% + 10px)",
                  background: "rgba(20,18,15,0.90)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  padding: "3px 8px",
                  borderRadius: 6,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.32)",
                  border: `1px solid ${point.color}55`,
                }}
              >
                {point.label}
              </span>
            )}

            {/* The dot button */}
            <button
              type="button"
              aria-label={`Select ${point.label}`}
              aria-pressed={isSelected}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onSelectMesh(point.meshId);
              }}
              onMouseEnter={() => setHoveredMeshId(point.meshId)}
              onMouseLeave={() => setHoveredMeshId(null)}
              className="flex items-center justify-center rounded-full bg-transparent p-0 outline-none"
              style={{ width: 32, height: 32 }}
            >
              {/* Pulsing ring on active */}
              {isSelected && (
                <span
                  className="absolute rounded-full animate-ping"
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: `${point.color}22`,
                    border: `1.5px solid ${point.color}55`,
                  }}
                />
              )}

              {/* Outer glow ring */}
              <span
                className="absolute rounded-full transition-all duration-150"
                style={{
                  width:  isActive ? 24 : 18,
                  height: isActive ? 24 : 18,
                  backgroundColor: `${point.color}18`,
                  border: `2px solid ${point.color}70`,
                  boxShadow: isActive
                    ? `0 0 10px ${point.color}80, 0 0 4px ${point.color}55`
                    : `0 0 6px ${point.color}33`,
                }}
              />

              {/* White outer ring + coloured centre */}
              <span
                className="absolute rounded-full border-2 border-white transition-all duration-150"
                style={{
                  width:  isActive ? 16 : 12,
                  height: isActive ? 16 : 12,
                  backgroundColor: point.color,
                  boxShadow: isActive
                    ? `0 0 0 2px ${point.color}44, 0 2px 8px rgba(0,0,0,0.38)`
                    : "0 1px 4px rgba(0,0,0,0.28)",
                }}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
};
