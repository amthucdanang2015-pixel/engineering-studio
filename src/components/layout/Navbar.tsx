"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wrench, CarFront, Menu, X, ChevronRight, BookOpen, ArrowLeft } from "lucide-react";

export interface NavbarProps {
  /** Optional back navigation link (e.g. return to catalog) */
  backHref?: string;
  /** Optional vehicle name displayed as breadcrumb */
  vehicleName?: string;
  /** Optional active part name pill */
  selectedPartName?: string;
  /** Callback to clear active part selection */
  onClearSelectedPart?: () => void;
  /** Callback to open vehicle library sheet on mobile */
  onOpenLibrary?: () => void;
}

/**
 * Global Navbar for Vehicle Studio.
 *
 * Minimal, clean, premium and editorial navigation sitting directly on the
 * page background with soft pill active states and Lucide icons.
 */
export const Navbar: React.FC<NavbarProps> = ({
  backHref,
  vehicleName,
  selectedPartName,
  onClearSelectedPart,
  onOpenLibrary,
}) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Two-stage drawer state for smooth entrance & exit animations
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [isDrawerActive, setIsDrawerActive] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Active route matching (query parameters like ?vehicle=... preserve the active section)
  const isBuildActive = pathname === "/build" || pathname.startsWith("/build?");
  const isGarageActive = pathname === "/garage" || pathname.startsWith("/garage?");

  // Open drawer with smooth entrance animation
  const handleOpen = useCallback(() => {
    setIsPortalOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsDrawerActive(true);
      });
    });
  }, []);

  // Close drawer with smooth exit animation before unmounting
  const handleClose = useCallback(() => {
    setIsDrawerActive(false);
    const timer = setTimeout(() => {
      setIsPortalOpen(false);
    }, 380);
    return () => clearTimeout(timer);
  }, []);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPortalOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPortalOpen, handleClose]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isPortalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPortalOpen]);

  const navItems = [
    {
      id: "build",
      label: "Build",
      href: "/build",
      icon: Wrench,
      isActive: isBuildActive,
    },
    {
      id: "garage",
      label: "Garage",
      href: "/garage",
      icon: CarFront,
      isActive: isGarageActive,
    },
  ];

  return (
    <>
      {/* ── GLOBAL NAVBAR CONTAINER (Sits directly on page background) ─────── */}
      <header className="w-full flex items-center justify-between py-3 pl-3 sm:pl-6 md:pl-8 pr-4 sm:pr-8 md:pr-10 lg:pr-12 mb-3 lg:mb-4 shrink-0 select-none bg-transparent">
        {/* Left: Branding & Vehicle Context */}
        <div className="flex items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="h-8 w-8 rounded-full bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900 border border-stone-200/70 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95"
              title="Return to Vehicle Selection"
            >
              <ArrowLeft size={15} />
            </Link>
          ) : (
            <Link href="/build" className="flex items-center gap-2.5 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-900 text-white shadow-2xs group-hover:scale-105 transition-transform">
                <img src="/images/favicon.ico" alt="" className="h-4 w-4" />
              </div>
            </Link>
          )}

          <div className="flex items-center gap-2">
            <Link
              href="/build"
              className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-900 hover:text-stone-700 transition-colors font-sans"
            >
              Vehicle Studio
            </Link>
            {vehicleName && (
              <>
                <span className="text-stone-300 text-xs font-light select-none">/</span>
                <span className="text-xs font-bold text-stone-600 hidden sm:inline truncate max-w-[200px]">
                  {vehicleName}
                </span>
              </>
            )}
          </div>

          {selectedPartName && (
            <div className="hidden md:flex items-center gap-1.5 bg-white/80 border border-stone-200/80 rounded-full px-2.5 py-0.5 ml-1 shadow-2xs animate-in fade-in duration-150">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e0564d]" />
              <span className="text-[11px] font-bold text-stone-800 truncate max-w-[140px]">
                {selectedPartName}
              </span>
              {onClearSelectedPart && (
                <button
                  type="button"
                  onClick={onClearSelectedPart}
                  className="text-stone-400 hover:text-stone-700 transition-colors ml-0.5 cursor-pointer"
                  aria-label="Clear part selection"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Desktop Horizontal Navigation with Soft Pill Active State */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.isActive) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/95 border border-stone-200/80 shadow-2xs text-stone-900 text-xs font-extrabold tracking-wider uppercase cursor-default select-none transition-all"
                >
                  <Icon size={14} className="text-[#e0564d]" />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase text-stone-500 hover:text-stone-900 hover:bg-stone-200/40 transition-all"
              >
                <Icon size={14} className="text-stone-400 group-hover:text-stone-700" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Header Controls */}
        <div className="flex md:hidden items-center gap-2">
          {onOpenLibrary && (
            <button
              type="button"
              onClick={onOpenLibrary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-stone-200/80 text-stone-800 hover:bg-white transition-all shadow-2xs active:scale-[0.97] cursor-pointer"
              aria-label="Open Vehicle Library"
            >
              <BookOpen size={14} className="text-[#e0564d]" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-stone-900 font-mono">
                Library
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpen}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-stone-200/70 text-stone-800 hover:bg-white transition-colors shadow-2xs active:scale-[0.97] cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu size={18} className="text-stone-700" />
            <span className="hidden sm:inline text-xs font-black uppercase tracking-wider text-stone-900 font-mono">
              MENU
            </span>
          </button>
        </div>
      </header>

      {/* ── PORTAL MOBILE NAVIGATION DRAWER OVERLAY ─────────────────────── */}
      {mounted && isPortalOpen && createPortal(
        <div className="md:hidden">
          {/* Full Viewport Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-stone-900/40 backdrop-blur-xs"
            style={{
              opacity: isDrawerActive ? 1 : 0,
              transition: isDrawerActive
                ? "opacity 380ms cubic-bezier(0.22, 1, 0.36, 1)"
                : "opacity 340ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Left Slide Drawer */}
          <aside
            className="fixed top-0 left-0 bottom-0 z-[9999] h-[100dvh] w-72 max-w-[80vw] bg-[#f7f4ed] border-r border-[#e8e2d5] shadow-2xl flex flex-col justify-between"
            style={{
              transform: isDrawerActive ? "translateX(0)" : "translateX(-100%)",
              transition: isDrawerActive
                ? "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)"
                : "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between p-4 border-b border-[#e8e2d5]">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-stone-900 text-white shadow-xs">
                    <img src="/images/favicon.ico" alt="" className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-stone-900">
                      VEHICLE STUDIO
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
                  aria-label="Close Navigation Menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="p-3 space-y-1.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 px-3 block mb-2 font-mono">
                  NAVIGATION
                </span>

                {navItems.map((item) => {
                  const Icon = item.icon;
                  if (item.isActive) {
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between w-full px-3.5 py-3 rounded-xl bg-white border border-[#e8e2d5] text-stone-900 font-extrabold text-xs uppercase tracking-wider shadow-2xs cursor-default"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={16} className="text-[#e0564d]" />
                          <span>{item.label}</span>
                        </div>
                        <span className="text-[9px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-mono border border-stone-200">
                          Active
                        </span>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={handleClose}
                      className="flex items-center justify-between w-full px-3.5 py-3 rounded-xl text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 font-bold text-xs uppercase tracking-wider transition-colors border border-transparent hover:border-stone-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className="text-stone-500" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight size={14} className="text-stone-400" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#e8e2d5] bg-stone-100/50 text-[10px] text-stone-400 font-mono text-center">
              Vehicle Studio engineering simulator
            </div>
          </aside>
        </div>,
        document.body
      )}
    </>
  );
};
