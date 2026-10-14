"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrganizationSwitcher } from "./organization-switcher";
import { SidebarNavigation } from "./sidebar-navigation";
import { SegmentedLogo } from "./segmented-logo";
import { useDashboard } from "@/context/dashboard-context";

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
  const { user } = useDashboard();
  const displayName = user?.fullName || "Tarif Al-Mozahed";
  const displayRole = user?.role || "Administrator";
  const displayInitials = user?.initials || "TA";

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container: Soft neutral aesthetic matching reference design */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#F7F8FA] border-r border-slate-200/70 transition-all duration-300 ease-in-out font-sans",
          // Desktop collapsed width
          collapsed ? "w-[76px]" : "w-64",
          // Mobile responsive slide-in drawer
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Top Header: 4-Quadrant Metallic Segmented Logo & App Name */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/60">
          <div className="flex items-center gap-3 min-w-0">
            {/* Metallic Segmented Logo Emblem */}
            <SegmentedLogo size={34} />
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-heading font-bold text-[17px] text-slate-900 tracking-tight block leading-tight">
                  Orbix
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wider block uppercase">
                  Enterprise ERP
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Organization Switcher Area */}
        <div className="px-3 py-2.5 border-b border-slate-200/60">
          <OrganizationSwitcher collapsed={collapsed} />
        </div>

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <SidebarNavigation collapsed={collapsed} onNavigate={onCloseMobile} />
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-slate-200/60 bg-[#F2F4F7]/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {displayInitials}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate font-heading">
                    {displayName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium truncate">
                    {displayRole}
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
