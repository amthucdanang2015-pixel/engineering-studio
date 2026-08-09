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
      {isBuildActive ? (
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all bg-[#e0564d] text-white shadow-xs cursor-default select-none"
        >
          <Car size={14} />
          <span>BUILD</span>
        </button>
      ) : (
        <Link
          href="/build"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 font-semibold"
        >
          <Car size={14} />
          <span>BUILD</span>
        </Link>
      )}

      {isGarageActive ? (
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all bg-[#e0564d] text-white shadow-xs cursor-default select-none"
        >
          <Wrench size={14} />
          <span>GARAGE</span>
        </button>
      ) : (
        <Link
          href="/garage"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 font-semibold"
        >
          <Wrench size={14} />
          <span>GARAGE</span>
        </Link>
      )}

      {isTestActive ? (
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all bg-[#e0564d] text-white shadow-xs cursor-default select-none"
        >
          <Gauge size={14} />
          <span>TEST</span>
        </button>
      ) : (
        <Link
          href="/test"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 font-semibold"
        >
          <Gauge size={14} />
          <span>TEST</span>
        </Link>
      )}
    </nav>
  );
};
