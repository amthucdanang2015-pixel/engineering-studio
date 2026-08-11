"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wrench, Car, Gauge, Menu, X, ChevronRight, BookOpen } from "lucide-react";

interface NavbarProps {
  onOpenLibrary?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLibrary }) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Two-stage drawer state for smooth entrance & exit animations
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [isDrawerActive, setIsDrawerActive] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Active route matching (ignoring query params like ?view=... or ?vehicle=...)
  const isBuildActive = pathname === "/build" || pathname.startsWith("/build?");
  const isGarageActive = pathname === "/garage" || pathname.startsWith("/garage?");
  const isTestActive = pathname === "/test" || pathname.startsWith("/test?");

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
      label: "BUILD",
      href: "/build",
      icon: Car,
      isActive: isBuildActive,
    },
    {
      id: "garage",
      label: "GARAGE",
      href: "/garage",
      icon: Wrench,
      isActive: isGarageActive,
    },
    {
      id: "test",
      label: "TEST",
      href: "/test",
      icon: Gauge,
      isActive: isTestActive,
    },
  ];

  return (
    <>
      {/* ── DESKTOP NAVIGATION BAR (Visible on md breakpoint & above) ──────── */}
      <nav className="hidden md:flex items-center gap-1 bg-stone-100/90 p-1 rounded-2xl border border-stone-200/80 shadow-2xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          if (item.isActive) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={(e) => e.preventDefault()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all bg-[#e0564d] text-white shadow-xs cursor-default select-none"
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 font-semibold"
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── MOBILE HEADER CONTROLS (Visible on screens smaller than md) ──── */}
      <div className="flex md:hidden items-center gap-2">
        {onOpenLibrary && (
          <button
            type="button"
            onClick={onOpenLibrary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#e8e2d5] text-stone-800 hover:bg-stone-50 transition-all shadow-2xs active:scale-[0.97] cursor-pointer"
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
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-800 hover:bg-stone-200/70 transition-colors shadow-2xs active:scale-[0.97]"
          aria-label="Open Navigation Menu"
        >
          <Menu size={18} className="text-stone-700" />
          <span className="text-xs font-black uppercase tracking-wider text-stone-900 font-mono">
            ESF
          </span>
        </button>
      </div>

      {/* ── PORTAL MOBILE NAVIGATION DRAWER OVERLAY ─────────────────────── */}
      {/* Renders directly into document.body with premium cubic-bezier easing */}
      {mounted && isPortalOpen && createPortal(
        <div className="md:hidden">
          {/* Full Viewport Dark Overlay with smooth opacity transition */}
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

          {/* Viewport-Level Left Slide Drawer with premium cubic-bezier easing */}
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e0564d]/10 text-[#e0564d] border border-[#e0564d]/20 font-black text-xs">
                    ESF
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-stone-900">
                      ESF Engineering
                    </h2>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                      V2 Studio
                    </span>
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
                <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 px-3 block mb-2">
                  Global Navigation
                </span>

                {navItems.map((item) => {
                  const Icon = item.icon;
                  if (item.isActive) {
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between w-full px-3.5 py-3 rounded-xl bg-[#e0564d] text-white font-extrabold text-xs uppercase tracking-wider shadow-sm cursor-default"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={16} />
                          <span>{item.label}</span>
                        </div>
                        <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-md font-mono">
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
              ESF V2 engineering simulator
            </div>
          </aside>
        </div>,
        document.body
      )}
    </>
  );
};
