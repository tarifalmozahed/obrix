"use client";

import { useState, useEffect, useCallback } from "react";
import { Hourglass, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { useDashboard } from "@/context/dashboard-context";
import { ProbationDuration } from "@/types/hrms";
import { fetchProbationDurations } from "@/lib/hrms";
import { ProbationTable } from "@/components/dashboard/hrms/configuration/probation-table";
import Link from "next/link";

export default function ProbationConfigPage() {
  const { activeOrg, orgLoading } = useDashboard();
  const [policies, setPolicies] = useState<ProbationDuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!activeOrg || activeOrg.id === "default-org") {
      setLoading(false);
      return;
    }

    try {
      setErrorMessage(null);
      const orgId = activeOrg.id;

      const res = await fetchProbationDurations(orgId);
      if (res.success && res.data) {
        setPolicies(res.data);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error loading probation policies");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeOrg]);

  useEffect(() => {
    if (!orgLoading) {
      loadData();
    }
  }, [orgLoading, loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans animate-in fade-in duration-150">
      {/* Configuration Breadcrumbs & Sub-Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/hrms/staff" className="hover:text-slate-800 transition-colors">
          HRMS
        </Link>
        <span>›</span>
        <span className="text-slate-400">Configuration</span>
        <span>›</span>
        <span className="text-slate-900 font-bold">Probation Duration</span>
      </div>

      {/* Sub-nav Links for Configuration Pages */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <Link
          href="/hrms/configuration/positions"
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          Positions & Designations
        </Link>
        <Link
          href="/hrms/configuration/probation"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
        >
          Probation Duration
        </Link>
        <Link
          href="/hrms/configuration/shifts"
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          Shifts & Rosters
        </Link>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Probation Table with Drawer */}
      <ProbationTable
        policies={policies}
        orgId={activeOrg?.id || ""}
        loading={loading}
        onRefresh={loadData}
      />
    </div>
  );
}
