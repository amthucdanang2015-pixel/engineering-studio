"use client";

import React, { useEffect, useRef, useState } from "react";

interface BuildTipCardProps {
  /** True once the GLB model has finished loading */
  modelLoaded: boolean;
}

/**
 * BuildTipCard
 *
 * Small floating instruction card in the upper-right corner of the 3D viewport.
 * Teaches the three core interactions:
 *   • Drag to rotate
 *   • Scroll to zoom
 *   • Click a dot to customize
 *
 * Appears 600ms after the model loads and fades out the moment the user
 * selects any part or dot. No localStorage — keeps it simple and reliable.
 */
export const BuildTipCard: React.FC<BuildTipCardProps> = ({ modelLoaded }) => {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show 600ms after model loads; once visible, stay visible regardless of loading state
  useEffect(() => {
    if (modelLoaded && !visible) {
      timerRef.current = setTimeout(() => setVisible(true), 600);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [modelLoaded, visible]);

  if (!visible) return null;

  return (
    <div
      aria-label="Tip: how to interact with the vehicle viewer"
      className="absolute top-3 right-3 z-20 pointer-events-none select-none"
      style={{
        transition: "opacity 0.38s ease, transform 0.38s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
      }}
    >
      <div
        className="rounded-2xl border border-stone-200/80 bg-[#faf8f4]/95 backdrop-blur-sm shadow-lg px-3.5 py-3"
        style={{ minWidth: "160px", maxWidth: "190px" }}
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="text-[#e0564d] text-[11px]">✦</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">
            Tip
          </span>
        </div>

        {/* Instruction lines */}
        <ul className="space-y-1.5 list-none m-0 p-0">
          {[
            "Drag to rotate",
            "Scroll to zoom",
            "Click a dot to customize",
          ].map((line) => (
            <li key={line} className="flex items-start gap-1.5">
              <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#e0564d]/60" />
              <span className="text-[11px] text-stone-600 leading-snug font-medium">
                {line}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
