"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronsUpDown, Check, Building2, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/context/dashboard-context";

interface OrganizationSwitcherProps {
  collapsed?: boolean;
}

export function OrganizationSwitcher({ collapsed = false }: OrganizationSwitcherProps) {
  const { organizations, activeOrg, setActiveOrg, createOrganization } = useDashboard();
  const [open, setOpen] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
        setShowCreateInput(false);
        setCreateError(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setCreating(true);
    setCreateError(null);

    const baseSlug = newOrgName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const slug = baseSlug.length < 2 ? `${baseSlug || "org"}-workspace` : baseSlug;
    const result = await createOrganization(newOrgName.trim(), slug);
    setCreating(false);

    if (result.success) {
      setNewOrgName("");
      setShowCreateInput(false);
      setOpen(false);
    } else {
      setCreateError(result.error || "Failed to create organization");
    }
  };

  const displayName = activeOrg?.name || "Acme Corporation";
  const displayRole =
    activeOrg?.role === "owner"
      ? "Owner"
      : activeOrg?.role === "admin"
      ? "Admin"
      : "Member";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors text-left",
          collapsed && "justify-center p-2"
        )}
        title={collapsed ? displayName : undefined}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {displayName}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {displayRole} Workspace
              </div>
            </div>
          )}
        </div>
        {!collapsed && <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          className={cn(
            "absolute top-full mt-1.5 w-64 rounded-xl bg-white border border-slate-200 shadow-lg p-1.5 z-50 animate-in fade-in-50 zoom-in-95",
            collapsed ? "left-full ml-2 top-0" : "left-0"
          )}
        >
          <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Switch Organization
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5 my-1">
            {organizations.map((org) => {
              const isSelected = activeOrg?.id === org.id;
              return (
                <button
                  key={org.id}
                  onClick={() => {
                    setActiveOrg(org);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors text-left",
                    isSelected
                      ? "bg-indigo-50/70 text-indigo-900 font-semibold"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className={cn("w-3.5 h-3.5 shrink-0", isSelected ? "text-indigo-600" : "text-slate-400")} />
                    <span className="truncate">{org.name}</span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="h-px bg-slate-100 my-1" />

          {/* Quick Add Organization */}
          {showCreateInput ? (
            <form onSubmit={handleCreateOrg} className="p-1 space-y-2">
              <input
                type="text"
                autoFocus
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Organization name..."
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500"
              />
              {createError && (
                <div className="text-[10px] text-rose-500 font-medium px-1">
                  {createError}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <button
                  type="submit"
                  disabled={creating || !newOrgName.trim()}
                  className="flex-1 py-1 rounded-md bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                >
                  {creating && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Create</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateInput(false);
                    setCreateError(null);
                  }}
                  className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowCreateInput(true)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Organization</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
