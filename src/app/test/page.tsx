import { Suspense } from "react";
import { TestView } from "@/features/test/components/TestView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test Simulation — ESF V2",
  description: "Vehicle performance testing and aerodynamic simulation suite.",
};

export default function TestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4f6f9]" />}>
      <TestView />
    </Suspense>
  );
}
