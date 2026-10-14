"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrganizationSwitcher } from "./organization-switcher";
import { SidebarNavigation } from "./sidebar-navigation";

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AppSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: AppSidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out",
          // Desktop collapsed width
          collapsed ? "w-[72px]" : "w-64",
          // Mobile responsive slide-in drawer
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Top Header: Logo & App Name */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Nexus Logo Badge */}
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0">
              N
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-bold text-base text-slate-900 tracking-tight block">
                  Nexus
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide block -mt-1 uppercase">
                  Enterprise ERP
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Organization Switcher Area */}
        <div className="p-3 border-b border-slate-200/80 bg-slate-50/50">
          <OrganizationSwitcher collapsed={collapsed} />
        </div>

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <SidebarNavigation collapsed={collapsed} onNavigate={onCloseMobile} />
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                AM
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    Alex Morgan
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium truncate">
                    Administrator
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Collapse / Expand Toggle Button */}
            <button
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(
                "hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors shrink-0",
                collapsed && "mx-auto"
              )}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
