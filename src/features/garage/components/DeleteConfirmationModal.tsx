"use client";

import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  vehicleName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  vehicleName,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100 shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-stone-900 tracking-tight">Delete Vehicle?</h2>
              <p className="text-xs text-stone-500 font-mono mt-0.5 truncate max-w-[220px]">
                {vehicleName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed mb-6">
          Are you sure you want to delete this vehicle? This action cannot be undone.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-extrabold text-xs tracking-wider uppercase transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
