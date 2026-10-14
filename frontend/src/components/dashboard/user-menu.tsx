"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleUserRound, Settings, LogOut, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase";

export function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

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
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="User menu"
      >
        <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center">
          AM
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in-50 zoom-in-95">
          <div className="px-2.5 py-2 border-b border-slate-100">
            <div className="text-xs font-bold text-slate-900">Alex Morgan</div>
            <div className="text-[11px] text-slate-500 font-mono">alex.morgan@acme.corp</div>
          </div>

          <div className="py-1">
            <Link
              href="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              <CircleUserRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Your Profile</span>
            </Link>

            <Link
              href="/dashboard/settings"
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
