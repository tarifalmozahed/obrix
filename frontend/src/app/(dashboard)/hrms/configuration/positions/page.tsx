"use client";

import { useState, useEffect, useCallback } from "react";
import { Briefcase, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { useDashboard } from "@/context/dashboard-context";
import { Position, Department } from "@/types/hrms";
import { fetchPositions, fetchDepartments } from "@/lib/hrms";
import { PositionsTable } from "@/components/dashboard/hrms/configuration/positions-table";
import Link from "next/link";

export default function PositionsConfigPage() {
  const { activeOrg, orgLoading } = useDashboard();
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
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

      const [posRes, deptRes] = await Promise.allSettled([
        fetchPositions(orgId),
        fetchDepartments(orgId),
      ]);

      if (posRes.status === "fulfilled" && posRes.value.success && posRes.value.data) {
        setPositions(posRes.value.data);
      }
      if (deptRes.status === "fulfilled" && deptRes.value.success && deptRes.value.data) {
        setDepartments(deptRes.value.data);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error loading positions");
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
        <span className="text-slate-900 font-bold">Positions & Designations</span>
      </div>

      {/* Sub-nav Links for Configuration Pages */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <Link
          href="/hrms/configuration/positions"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
        >
          Positions & Designations
        </Link>
        <Link
          href="/hrms/configuration/probation"
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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

      {/* Positions Table with Drawer */}
      <PositionsTable
        positions={positions}
        departments={departments}
        orgId={activeOrg?.id || ""}
        loading={loading}
        onRefresh={loadData}
      />
    </div>
  );
}
