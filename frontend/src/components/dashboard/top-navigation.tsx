"use client";

import { Menu, Search } from "lucide-react";
import { Breadcrumbs } from "./breadcrumbs";
import { NotificationMenu } from "./notification-menu";
import { UserMenu } from "./user-menu";
import { useState } from "react";

interface TopNavigationProps {
  onOpenMobileSidebar: () => void;
}

export function TopNavigation({ onOpenMobileSidebar }: TopNavigationProps) {
  const [searchValue, setSearchValue] = useState("");

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-xs sm:px-6">
      {/* Left section: Mobile Hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open mobile navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">
          <Breadcrumbs />
        </div>
      </div>

      {/* Middle/Right section: Search & Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Global Search Bar */}
        <div className="relative w-44 sm:w-64 md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search records, tasks..."
            aria-label="Global search"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-9 pr-9 text-xs text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline-block">
            /
          </kbd>
        </div>

        {/* Separator */}
        <div className="hidden h-5 w-px bg-slate-200 sm:block" />

        {/* Notification Bell Dropdown */}
        <NotificationMenu />

        {/* User Profile & Menu */}
        <UserMenu />
      </div>
    </header>
  );
}
