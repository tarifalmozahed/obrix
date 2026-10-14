"use client";

import { useDashboard } from "@/context/dashboard-context";
import { CircleUserRound, Mail, Shield, Building2, KeyRound, LogOut } from "lucide-react";

export default function ProfilePage() {
  const { user, activeOrg, signOut } = useDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          User Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Your authenticated identity, role permissions, and active organization membership.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-indigo-100 border-2 border-indigo-200 text-indigo-700 font-extrabold text-2xl flex items-center justify-center shadow-xs">
            {user?.initials || "U"}
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            {user?.fullName || "Authenticated User"}
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {user?.email || "No email available"}
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Shield className="w-3.5 h-3.5" />
            <span>{user?.role || "Member"}</span>
          </div>

          <div className="w-full mt-6 pt-6 border-t border-slate-100 flex justify-center">
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Orbix</span>
            </button>
          </div>
        </div>

        {/* Identity & Workspace Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>Authentication Credentials</span>
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-slate-500 font-medium">User Identifier (UUID)</span>
                <span className="font-mono text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 truncate max-w-sm">
                  {user?.id || "Unavailable"}
                </span>
              </div>
              <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-slate-500 font-medium">Primary Email</span>
                <span className="font-medium text-slate-900 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {user?.email}
                </span>
              </div>
              <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-slate-500 font-medium">Global Role</span>
                <span className="font-semibold text-indigo-600">
                  {user?.role}
                </span>
              </div>
              <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-slate-500 font-medium">Auth Provider</span>
                <span className="font-medium text-slate-700">
                  Supabase PostgreSQL Auth
                </span>
              </div>
            </div>
          </div>

          {/* Active Workspace / Organization */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Active Organization Workspace</span>
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-slate-500 font-medium">Organization Name</span>
                <span className="font-semibold text-slate-900">
                  {activeOrg?.name || "None Selected"}
                </span>
              </div>
              <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-slate-500 font-medium">Organization Slug</span>
                <span className="font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                  {activeOrg?.slug || "default"}
                </span>
              </div>
              <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-slate-500 font-medium">Workspace Role</span>
                <span className="font-semibold text-emerald-600 uppercase tracking-wider text-[11px]">
                  {activeOrg?.role || "Member"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
