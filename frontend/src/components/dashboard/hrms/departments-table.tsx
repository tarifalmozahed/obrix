"use client";

import { useState } from "react";
import {
  Building2,
  Search,
  Plus,
  Loader2,
  Users,
  Calendar,
  X,
} from "lucide-react";
import { Department, Employee } from "@/types/hrms";
import { apiRequest } from "@/lib/api";
import { createClient } from "@/lib/supabase";

interface DepartmentsTableProps {
  departments: Department[];
  employees: Employee[];
  orgId: string;
  loading: boolean;
  onRefresh: () => void;
}

export function DepartmentsTable({
  departments,
  employees,
  orgId,
  loading,
  onRefresh,
}: DepartmentsTableProps) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = departments.filter((dept) => {
    return (
      dept.name.toLowerCase().includes(search.toLowerCase()) ||
      (dept.description && dept.description.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const getEmployeeCount = (deptId: string, dept: Department) => {
    // 1. Check local employees array count
    const localCount = employees.filter((e) => e.department_id === deptId).length;
    if (localCount > 0) return localCount;

    // 2. Check aggregate count from Supabase response
    if (Array.isArray(dept.employees) && dept.employees[0]?.count !== undefined) {
      return dept.employees[0].count;
    }
    if (typeof dept.employees === "number") {
      return dept.employees;
    }
    return localCount;
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Department name is required.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
    };

    try {
      // 1. Try Express API
      const res = await apiRequest("/hrms/departments", {
        method: "POST",
        body: JSON.stringify(payload),
      }, orgId);

      if (res.success) {
        resetForm();
        onRefresh();
        return;
      }

      // 2. Fallback direct Supabase insert
      const supabase = createClient();
      const { error: sbError } = await supabase.from("departments").insert({
        organization_id: orgId,
        name: payload.name,
        description: payload.description || null,
      });

      if (sbError) {
        setFormError(sbError.message || res.error?.message || "Failed to create department");
      } else {
        resetForm();
        onRefresh();
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error creating department");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setIsModalOpen(false);
    setFormError(null);
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
      {/* Filter Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
        <div className="relative w-full max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Departments Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Headcount</th>
              <th className="py-3 px-4 text-right">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Loading departments...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-slate-800 text-xs">No departments found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Organize your company workforce into functional teams like Engineering, Sales, and Marketing.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Department</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((dept) => {
                const count = getEmployeeCount(dept.id, dept);

                return (
                  <tr key={dept.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-900">{dept.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-md truncate">
                      {dept.description || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        <Users className="w-3 h-3 text-slate-500" />
                        <span>{count} {count === 1 ? "Employee" : "Employees"}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
                      {new Date(dept.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer: Add Department */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={resetForm}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200 animate-in slide-in-from-right duration-300 h-full">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-heading">Create Department</h3>
                    <p className="text-[11px] text-slate-400">Establish a new organizational division</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDepartment} className="p-6 flex-1 overflow-y-auto space-y-4">
                {formError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Engineering & Product"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Primary focus and responsibilities of this division..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 shadow-xs"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Department</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
