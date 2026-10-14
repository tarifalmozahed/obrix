"use client";

import { useEffect, useRef, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  headerActions?: ReactNode;
  badge?: ReactNode;
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "xl",
  headerActions,
  badge,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-xl",
    xl: "max-w-2xl",
    "2xl": "max-w-3xl",
    "3xl": "max-w-4xl",
    full: "max-w-full",
  }[size];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        {/* Drawer Panel */}
        <div
          ref={drawerRef}
          className={cn(
            "w-screen bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200/80 animate-in slide-in-from-right duration-300",
            sizeClasses
          )}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-6 py-4.5 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between shrink-0">
            <div className="min-w-0 pr-4">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900 font-heading truncate">
                  {title}
                </h2>
                {badge}
              </div>
              {description && (
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                  {description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                title="Close Drawer (Esc)"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/90 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
