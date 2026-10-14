"use client";

import { useState } from "react";
import {
  Building2,
  Users,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Calendar,
  Globe,
  Plus,
} from "lucide-react";
import { useDashboard } from "@/context/dashboard-context";
import { cn } from "@/lib/utils";

export function OrganizationInfoCard() {
  const { activeOrg, orgLoading, refreshUserData, organizations, setActiveOrg } = useDashboard();
  const [copied, setCopied] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const handleCopyId = () => {
    if (!activeOrg?.id) return;
    navigator.clipboard.writeText(activeOrg.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayName = activeOrg?.name || "Workspace";
  const displaySlug = activeOrg?.slug || "default";
  const displayRole = activeOrg?.role
    ? activeOrg.role.charAt(0).toUpperCase() + activeOrg.role.slice(1)
    : "Member";
  const memberCount = activeOrg?.memberCount ?? (activeOrg?.members?.length || 1);
  const createdDate = activeOrg?.createdAt
    ? new Date(activeOrg.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently Created";

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
      {/* Top Banner: Org Name, Slug, & Refresh Trigger */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-lg shadow-xs">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 truncate">
                {displayName}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Organization
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
              <Globe className="h-3 w-3" />
              <span>orbix.io/{displaySlug}</span>
            </p>
          </div>
        </div>

        {/* Right Action: Refresh & Switcher Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refreshUserData()}
            disabled={orgLoading}
            title="Fetch latest organization info from database"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-slate-500", orgLoading && "animate-spin text-indigo-600")} />
            <span>{orgLoading ? "Fetching..." : "Fetch Info"}</span>
          </button>
        </div>
      </div>

      {/* Organization Key Info Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 py-4">
        {/* Workspace ID */}
        <div className="rounded-lg bg-slate-50/70 p-3 border border-slate-100">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Workspace ID
          </div>
          <div className="mt-1 flex items-center justify-between gap-1">
            <span className="font-mono text-xs font-semibold text-slate-800 truncate">
              {activeOrg?.id ? `${activeOrg.id.slice(0, 8)}...` : "—"}
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              className="text-slate-400 hover:text-slate-700 transition-colors p-0.5"
              title="Copy Organization UUID"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Your Role */}
        <div className="rounded-lg bg-slate-50/70 p-3 border border-slate-100">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Your Access Role
          </div>
          <div className="mt-1 flex items-center gap-1.5 font-semibold text-xs text-indigo-600">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
            <span>{displayRole}</span>
          </div>
        </div>

        {/* Team Members */}
        <div className="rounded-lg bg-slate-50/70 p-3 border border-slate-100">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Team Members
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              {memberCount} {memberCount === 1 ? "Member" : "Members"}
            </span>
            {activeOrg?.members && activeOrg.members.length > 0 && (
              <button
                type="button"
                onClick={() => setShowMembers(!showMembers)}
                className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700"
              >
                {showMembers ? "Hide" : "View"}
              </button>
            )}
          </div>
        </div>

        {/* Created At */}
        <div className="rounded-lg bg-slate-50/70 p-3 border border-slate-100">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Created Date
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{createdDate}</span>
          </div>
        </div>
      </div>

      {/* Expanded Team Members List */}
      {showMembers && activeOrg?.members && (
        <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50/40 p-3 animate-in fade-in-50 duration-150">
          <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
            <span>Organization Members Directory</span>
            <span className="text-[10px] text-slate-400 font-normal">
              RLS Verified
            </span>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {activeOrg.members.map((m) => (
              <div key={m.id} className="py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {m.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {m.fullName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {m.email}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
