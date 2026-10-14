"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { useDashboard } from "@/context/dashboard-context";
import { Department, Employee } from "@/types/hrms";
import { apiRequest } from "@/lib/api";
import { DepartmentsTable } from "@/components/dashboard/hrms/departments-table";

export default function DepartmentsPage() {
  const { activeOrg, orgLoading } = useDashboard();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
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

      const [deptRes, empRes] = await Promise.allSettled([
        apiRequest<Department[]>("/hrms/departments", {}, orgId),
        apiRequest<Employee[]>("/hrms/employees", {}, orgId),
      ]);

      if (deptRes.status === "fulfilled" && deptRes.value.success && deptRes.value.data) {
        setDepartments(deptRes.value.data);
      }
      if (empRes.status === "fulfilled" && empRes.value.success && empRes.value.data) {
        setEmployees(empRes.value.data);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error loading departments");
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Structure & Hierarchy
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight mt-0.5">
            Departments & Divisions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize teams, assign responsibilities, and monitor divisional employee allocations
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Departments Table with slide-over drawer */}
      <DepartmentsTable
        departments={departments}
        employees={employees}
        orgId={activeOrg?.id || ""}
        loading={loading}
        onRefresh={loadData}
      />
    </div>
  );
}
