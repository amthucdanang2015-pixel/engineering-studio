"use client";

import React, { useEffect, useRef, useState } from "react";
import { MousePointer2 } from "lucide-react";

const STORAGE_KEY = "build-customization-onboarding-dismissed";

interface BuildOnboardingHintProps {
  /** True once the GLB model has finished loading */
  modelLoaded: boolean;
  /** True once the user has selected any vehicle part */
  partSelected: boolean;
}

/**
 * BuildOnboardingHint
 *
 * A clean, simple first-time onboarding callout that floats gently above the
 * vehicle. No leader lines or world-space markers — just a card with a small
 * downward chevron that immediately communicates "look at the car below".
 *
 * Positioning: centered horizontally, sits in the upper ~20% of the viewport
 * container so the car body remains fully visible beneath it.
 *
 * Animation: slow ease-in-out vertical float (4–6 px, ~2.6 s).
 * Reduced-motion: float removed, card is static but fully visible.
 *
 * Dismissed: on first part selection, fades out and writes to localStorage.
 */
export const BuildOnboardingHint: React.FC<BuildOnboardingHintProps> = ({
  modelLoaded,
  partSelected,
}) => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  const [phase, setPhase] = useState<"hidden" | "visible" | "hiding">("hidden");
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Appear after model loads
  useEffect(() => {
    if (!modelLoaded || dismissed) return;
    const t = setTimeout(() => setPhase("visible"), 600);
    return () => clearTimeout(t);
  }, [modelLoaded, dismissed]);

  // Dismiss when a part is selected
  useEffect(() => {
    if (!partSelected || phase !== "visible") return;
    setPhase("hiding");
    hideTimerRef.current = setTimeout(() => {
      setPhase("hidden");
      setDismissed(true);
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        // silent — localStorage unavailable
      }
    }, 350);
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [partSelected, phase]);

  if (dismissed || phase === "hidden") return null;

  return (
    <>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes esf-hint-float {
            0%   { transform: translateY(0px);  }
            50%  { transform: translateY(-5px); }
            100% { transform: translateY(0px);  }
          }
          .esf-hint-float {
            animation: esf-hint-float 2.6s ease-in-out infinite;
          }
        }
      `}</style>

      {/*
        Outer overlay: covers the viewport, non-blocking.
        Fades + slides the whole element out on dismiss.
      */}
      <div
        aria-live="polite"
        aria-label="Select a vehicle part to start customizing"
        className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center"
        style={{
          paddingTop: "8%",
          transition: "opacity 0.35s ease, transform 0.35s ease",
          opacity: phase === "hiding" ? 0 : 1,
          transform: phase === "hiding" ? "translateY(-10px)" : "translateY(0)",
        }}
      >
        {/* Floating wrapper — applies the gentle float */}
        <div className="esf-hint-float flex flex-col items-center pointer-events-auto">
          {/* Card */}
          <div
            className="
              flex items-center gap-3
              bg-stone-900/90 backdrop-blur-md
              text-white rounded-2xl
              px-5 py-3.5
              shadow-2xl
              border border-white/10
            "
            style={{ maxWidth: "min(280px, 80vw)" }}
          >
            {/* Icon badge */}
            <span className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-[#e0564d]/20 text-[#f5a623]">
              <MousePointer2 size={16} />
            </span>

            {/* Text */}
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-white leading-snug">
                Click a part to start
              </p>
              <p className="text-[11px] text-stone-300 leading-snug mt-0.5">
                customizing your vehicle
              </p>
            </div>
          </div>

          {/* Downward chevron — attached directly below the card */}
          <svg
            aria-hidden="true"
            width="16"
            height="10"
            viewBox="0 0 16 10"
            fill="none"
            className="mt-1.5 opacity-60"
          >
            <path
              d="M1 1 L8 8 L15 1"
              stroke="#e0564d"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </>
  );
};
