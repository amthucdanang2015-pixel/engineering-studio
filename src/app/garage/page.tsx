import { Suspense } from "react";
import { GarageView } from "@/features/garage/components/GarageView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Garage — Vehicle Studio",
  description: "Select and configure your Vehicle Studio architecture.",
};

export default function GaragePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4f6f9]" />}>
      <GarageView />
    </Suspense>
  );
}
