"use client";

import { OrganizationInfoCard } from "@/components/dashboard/organization-info-card";
import { Building2, Shield, Bell, Key, Database } from "lucide-react";
import { useDashboard } from "@/context/dashboard-context";

export default function SettingsPage() {
  const { organizations, activeOrg, user } = useDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          System & Organization Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your organization workspace parameters, roles, members, and connected system preferences.
        </p>
      </div>

      {/* Organization Information & Member Directory */}
      <OrganizationInfoCard />

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workspace Configurations */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Connected Workspaces</span>
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Organizations associated with your account ({user?.email}).
          </p>

          <div className="space-y-2">
            {organizations.map((org) => {
              const isActive = activeOrg?.id === org.id;
              return (
                <div
                  key={org.id}
                  className={`flex items-center justify-between p-3 rounded-lg border text-xs ${
                    isActive
                      ? "border-indigo-200 bg-indigo-50/50"
                      : "border-slate-100 bg-slate-50/60"
                  }`}
                >
                  <div>
                    <span className="font-semibold text-slate-900">{org.name}</span>
                    <span className="text-slate-400 font-mono text-[11px] block">
                      @{org.slug}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {org.role}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-bold text-indigo-600">
                        Current
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security & System Info */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-indigo-600" />
            <span>Infrastructure & Access Control</span>
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Database tenancy and authorization parameters enforced for this workspace.
          </p>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Row Level Security (RLS)</span>
              <span className="font-semibold text-emerald-600">Enforced & Active</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Authentication</span>
              <span className="font-medium text-slate-800">Supabase Auth (JWT)</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">API Gateway</span>
              <span className="font-medium text-slate-800">Express REST (Port 5000)</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Active Tenant ID</span>
              <span className="font-mono text-slate-600 truncate max-w-[180px]">
                {activeOrg?.id || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
