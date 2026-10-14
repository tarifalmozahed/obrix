"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronsUpDown, Check, Building2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const defaultOrganizations = [
  { id: "1", name: "Acme Corporation", role: "Owner", tier: "Enterprise" },
  { id: "2", name: "Nexus Global", role: "Admin", tier: "Growth" },
  { id: "3", name: "Stark Industries", role: "Member", tier: "Starter" },
];

interface OrganizationSwitcherProps {
  collapsed?: boolean;
}

export function OrganizationSwitcher({ collapsed = false }: OrganizationSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(defaultOrganizations[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors text-left",
          collapsed && "justify-center p-2"
        )}
        title={collapsed ? selectedOrg.name : undefined}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
            {selectedOrg.name.charAt(0)}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {selectedOrg.name}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {selectedOrg.tier} Tier
              </div>
            </div>
          )}
        </div>
        {!collapsed && <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className={cn(
          "absolute top-full mt-1.5 w-60 rounded-xl bg-white border border-slate-200 shadow-lg p-1.5 z-50 animate-in fade-in-50 zoom-in-95",
          collapsed ? "left-full ml-2 top-0" : "left-0"
        )}>
          <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Organizations
          </div>
          {defaultOrganizations.map((org) => (
            <button
              key={org.id}
              onClick={() => {
                setSelectedOrg(org);
                setOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-medium text-slate-800 truncate">{org.name}</span>
              </div>
              {selectedOrg.id === org.id && (
                <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              )}
            </button>
          ))}
          <div className="h-px bg-slate-100 my-1" />
          <button
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Organization</span>
          </button>
        </div>
      )}
    </div>
  );
}
