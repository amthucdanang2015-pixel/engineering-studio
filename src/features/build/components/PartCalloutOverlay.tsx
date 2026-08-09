"use client";

import React from "react";

interface PartCalloutOverlayProps {
  attachCallout: (node: HTMLDivElement | null) => void;
}

// Issue 3 Fix: Selection indicator is rendered in top floating status card and left sidebar to prevent bottom-left viewport text clipping.
export const PartCalloutOverlay: React.FC<PartCalloutOverlayProps> = () => {
  return null;
};
