"use client";

import { useState, useMemo } from "react";
import {
  Briefcase,
  Plus,
  Search,
  DollarSign,
  Building2,
  Trash2,
  Loader2,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { Position, Department } from "@/types/hrms";
import { createPosition, deletePosition } from "@/lib/hrms";

interface PositionsTableProps {
  positions: Position[];
  departments: Department[];
  orgId: string;
  loading: boolean;
  onRefresh: () => void;
}

export function PositionsTable({
  positions,
  departments,
  orgId,
  loading,
  onRefresh,
}: PositionsTableProps) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [basicSalary, setBasicSalary] = useState("65000");
  const [houseRentAllowance, setHouseRentAllowance] = useState("12000");
  const [medicalAllowance, setMedicalAllowance] = useState("5000");
  const [transportAllowance, setTransportAllowance] = useState("3000");
  const [currency, setCurrency] = useState("USD");
  const [payFrequency, setPayFrequency] = useState("Monthly");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setDepartmentId("");
    setBasicSalary("65000");
    setHouseRentAllowance("12000");
    setMedicalAllowance("5000");
    setTransportAllowance("3000");
    setCurrency("USD");
    setPayFrequency("Monthly");
    setDescription("");
    setIsDrawerOpen(false);
    setFormError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Position title is required.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const basic = parseFloat(basicSalary) || 0;
      const hra = parseFloat(houseRentAllowance) || 0;
      const med = parseFloat(medicalAllowance) || 0;
      const trans = parseFloat(transportAllowance) || 0;

      const res = await createPosition(orgId, {
        title: title.trim(),
        department_id: departmentId || undefined,
        basic_salary: basic,
        house_rent_allowance: hra,
        medical_allowance: med,
        transport_allowance: trans,
        currency,
        pay_frequency: payFrequency,
        description: description.trim() || undefined,
      });

      if (res.success) {
        resetForm();
        onRefresh();
      } else {
        setFormError(res.error?.message || "Failed to create position.");
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create position.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this position configuration?")) return;
    setDeletingId(id);
    try {
      const res = await deletePosition(orgId, id);
      if (res.success) {
        onRefresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    return positions.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.departments?.name || "").toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === "all" || p.department_id === deptFilter;
      return matchSearch && matchDept;
    });
  }, [positions, search, deptFilter]);

  return (
    <div className="space-y-4 font-sans">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 font-heading">
            Positions & Designations
          </h2>
          <p className="text-xs text-slate-500">
            Define organizational roles and default position-wise salary structures
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Position</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5 flex-1">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search positions..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            {filtered.length} {filtered.length === 1 ? "Role" : "Roles"} Configured
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Position / Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Basic Salary</th>
                <th className="py-3 px-4">Allowances (HRA + Med + Trans)</th>
                <th className="py-3 px-4">Pay Frequency</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading positions directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-slate-800 text-xs">No positions configured</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Create positions to standardize job titles and compensation packages.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsDrawerOpen(true)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Position</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((pos) => {
                  const basic = Number(pos.basic_salary) || 0;
                  const totalAllowances =
                    (Number(pos.house_rent_allowance) || 0) +
                    (Number(pos.medical_allowance) || 0) +
                    (Number(pos.transport_allowance) || 0);

                  return (
                    <tr key={pos.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{pos.title}</div>
                            {pos.description && (
                              <div className="text-[11px] text-slate-400 truncate max-w-xs">
                                {pos.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {pos.departments?.name || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {pos.currency || "USD"} {basic.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-700 font-medium">
                          +{pos.currency || "USD"} {totalAllowances.toLocaleString()}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          HRA: {pos.house_rent_allowance} · Med: {pos.medical_allowance} · Trans: {pos.transport_allowance}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {pos.pay_frequency || "Monthly"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          disabled={deletingId === pos.id}
                          onClick={() => handleDelete(pos.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Position"
                        >
                          {deletingId === pos.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-Over Drawer: Add Position */}
      {isDrawerOpen && (
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
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-heading">New Position</h3>
                    <p className="text-[11px] text-slate-400">Configure role & default salary structure</p>
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

              <form onSubmit={handleCreate} className="p-6 flex-1 overflow-y-auto space-y-4">
                {formError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Position Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Lead Full-Stack Architect"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="">No Department Attached</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Default Salary Structure</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-1">
                        Basic Salary
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={basicSalary}
                        onChange={(e) => setBasicSalary(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-1">
                        House Rent Allow.
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={houseRentAllowance}
                        onChange={(e) => setHouseRentAllowance(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-1">
                        Medical Allowance
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={medicalAllowance}
                        onChange={(e) => setMedicalAllowance(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-1">
                        Transport Allowance
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={transportAllowance}
                        onChange={(e) => setTransportAllowance(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-1">
                        Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="BDT">BDT (৳)</option>
                        <option value="INR">INR (₹)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-1">
                        Pay Frequency
                      </label>
                      <select
                        value={payFrequency}
                        onChange={(e) => setPayFrequency(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Bi-weekly">Bi-weekly</option>
                        <option value="Weekly">Weekly</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Role Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Key responsibilities and qualifications..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 resize-none"
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
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-xs"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Position</span>
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
