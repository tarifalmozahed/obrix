"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { CircleUserRound, Settings, LogOut, ChevronDown } from "lucide-react";
import { useDashboard } from "@/context/dashboard-context";

export function UserMenu() {
  const { user, signOut } = useDashboard();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
  };

  const displayName = user?.fullName || "User";
  const displayEmail = user?.email || "user@example.com";
  const displayInitials = user?.initials || "U";
  const displayRole = user?.role || "Member";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="User menu"
      >
        <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center">
          {displayInitials}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in-50 zoom-in-95">
          <div className="px-2.5 py-2 border-b border-slate-100">
            <div className="text-xs font-bold text-slate-900 truncate">
              {displayName}
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate">
              {displayEmail}
            </div>
            <div className="mt-1">
              <span className="inline-block text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5">
                {displayRole}
              </span>
            </div>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              <CircleUserRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Your Profile</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Preferences</span>
            </Link>
          </div>

          <div className="h-px bg-slate-100 my-1" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
