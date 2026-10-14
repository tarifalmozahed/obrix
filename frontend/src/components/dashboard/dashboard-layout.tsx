"use client";

import { useState } from "react";
import { AppSidebar } from "./app-sidebar";
import { TopNavigation } from "./top-navigation";
import { cn } from "@/lib/utils";
import { DashboardProvider } from "@/context/dashboard-context";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased">
      {/* Collapsible Enterprise Sidebar */}
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area Container (offset for fixed sidebar on desktop) */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300 ease-in-out",
          collapsed ? "lg:pl-[72px]" : "lg:pl-64"
        )}
      >
        {/* Sticky Top Navigation */}
        <TopNavigation onOpenMobileSidebar={() => setMobileOpen(true)} />

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}
