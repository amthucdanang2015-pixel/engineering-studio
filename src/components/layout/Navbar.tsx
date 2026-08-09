"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wrench, Car, Gauge } from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  const isBuildActive = pathname === "/build" || pathname.startsWith("/build?");
  const isGarageActive = pathname === "/garage" || pathname.startsWith("/garage?");
  const isTestActive = pathname === "/test" || pathname.startsWith("/test?");

  return (
    <nav className="flex items-center gap-1 bg-stone-100/90 p-1 rounded-2xl border border-stone-200/80 shadow-2xs">
      <Link
        href="/build"
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all ${
          isBuildActive
            ? "bg-[#e0564d] text-white shadow-xs"
            : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 font-semibold"
        }`}
      >
        <Car size={14} />
        <span>BUILD</span>
      </Link>

      <Link
        href="/garage"
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all ${
          isGarageActive
            ? "bg-[#e0564d] text-white shadow-xs"
            : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 font-semibold"
        }`}
      >
        <Wrench size={14} />
        <span>GARAGE</span>
      </Link>

      <Link
        href="/test"
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all ${
          isTestActive
            ? "bg-[#e0564d] text-white shadow-xs"
            : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 font-semibold"
        }`}
      >
        <Gauge size={14} />
        <span>TEST</span>
      </Link>
    </nav>
  );
};
