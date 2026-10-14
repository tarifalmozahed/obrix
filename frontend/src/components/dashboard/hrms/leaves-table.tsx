"use client";

import { useState } from "react";
import {
  CalendarCheck,
  Search,
  Plus,
  Loader2,
  Calendar,
  Check,
  X,
  AlertCircle,
  Clock,
} from "lucide-react";
import { LeaveRequest, Employee, LeaveType } from "@/types/hrms";
import { apiRequest } from "@/lib/api";
import { createClient } from "@/lib/supabase";

interface LeavesTableProps {
  leaves: LeaveRequest[];
  employees: Employee[];
  orgId: string;
  loading: boolean;
  onRefresh: () => void;
}

export function LeavesTable({
  leaves,
  employees,
  orgId,
  loading,
  onRefresh,
}: LeavesTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Form State
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = leaves.filter((leave) => {
    const emp = leave.employees;
    const fullName = emp ? `${emp.first_name} ${emp.last_name}`.toLowerCase() : "";
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      leave.reason.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || leave.status === statusFilter;

    const matchesType =
      typeFilter === "all" || leave.leave_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e.getTime() - s.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Review
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getTypeBadge = (type: LeaveType) => {
    switch (type) {
      case "annual":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Annual Leave
          </span>
        );
      case "sick":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Sick Leave
          </span>
        );
      case "casual":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Casual
          </span>
        );
      case "maternity":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Maternity / Paternity
          </span>
        );
      case "unpaid":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Unpaid Leave
          </span>
        );
    }
  };

  const handleUpdateStatus = async (leaveId: string, newStatus: "approved" | "rejected") => {
    try {
      setUpdatingId(leaveId);

      // 1. Try Express API
      const res = await apiRequest(`/hrms/leaves/${leaveId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      }, orgId);

      if (res.success) {
        onRefresh();
        return;
      }

      // 2. Direct Supabase fallback
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: sbError } = await supabase
        .from("leave_requests")
        .update({
          status: newStatus,
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", leaveId)
        .eq("organization_id", orgId);

      if (sbError) {
        alert(`Failed to update leave request: ${sbError.message}`);
      } else {
        onRefresh();
      }
    } catch (err: unknown) {
      alert(`Error updating leave request: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !reason.trim()) {
      setFormError("Please select an employee and provide a valid reason.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload = {
      employeeId: selectedEmpId,
      leaveType,
      startDate,
      endDate,
      reason: reason.trim(),
    };

    try {
      // 1. Try Express API
      const res = await apiRequest("/hrms/leaves", {
        method: "POST",
        body: JSON.stringify(payload),
      }, orgId);

      if (res.success) {
        resetForm();
        onRefresh();
        return;
      }

      // 2. Direct Supabase fallback
      const supabase = createClient();
      const { error: sbError } = await supabase.from("leave_requests").insert({
        organization_id: orgId,
        employee_id: payload.employeeId,
        leave_type: payload.leaveType,
        start_date: payload.startDate,
        end_date: payload.endDate,
        reason: payload.reason,
        status: "pending",
      });

      if (sbError) {
        setFormError(sbError.message || res.error?.message || "Failed to submit leave request");
      } else {
        resetForm();
        onRefresh();
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error submitting leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedEmpId("");
    setLeaveType("annual");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
    setReason("");
    setIsModalOpen(false);
    setFormError(null);
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
      {/* Top Filter Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/40">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leaves by employee or reason..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="annual">Annual</option>
            <option value="sick">Sick</option>
            <option value="casual">Casual</option>
            <option value="maternity">Maternity/Paternity</option>
            <option value="unpaid">Unpaid</option>
          </select>

          {/* Request Leave Button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Request Leave</span>
          </button>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Leave Type</th>
              <th className="py-3 px-4">Duration & Dates</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Loading leave requests...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-slate-800 text-xs">No leave requests found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {search || statusFilter !== "all" || typeFilter !== "all"
                        ? "No leave requests match the selected filters."
                        : "No team members have active leave requests submitted."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Submit Leave Request</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((leave) => {
                const emp = leave.employees;
                const initials = emp ? `${emp.first_name?.[0] || ""}${emp.last_name?.[0] || ""}`.toUpperCase() : "E";
                const days = calculateDays(leave.start_date, leave.end_date);
                const isUpdating = updatingId === leave.id;

                return (
                  <tr key={leave.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Employee */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">
                            {emp ? `${emp.first_name} ${emp.last_name}` : "Team Member"}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            {emp?.job_title || "Employee"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Leave Type */}
                    <td className="py-3 px-4">{getTypeBadge(leave.leave_type)}</td>

                    {/* Dates & Days */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                      <div>
                        {new Date(leave.start_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        →{" "}
                        {new Date(leave.end_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans font-medium">
                        {days} {days === 1 ? "day" : "days"} requested
                      </span>
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={leave.reason}>
                      {leave.reason}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">{getStatusBadge(leave.status)}</td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      {leave.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(leave.id, "approved")}
                            title="Approve Leave Request"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-semibold transition-colors disabled:opacity-50"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(leave.id, "rejected")}
                            title="Reject Leave Request"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-[11px] font-semibold transition-colors disabled:opacity-50"
                          >
                            <X className="w-3 h-3 text-rose-600" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Decision recorded
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer: Request Leave */}
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
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-heading">Request Leave</h3>
                    <p className="text-[11px] text-slate-400">Submit employee absence for review</p>
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

              <form onSubmit={handleCreateLeave} className="p-6 flex-1 overflow-y-auto space-y-4">
                {formError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                    {formError}
                  </div>
                )}

                {/* Employee Select */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Employee *
                  </label>
                  <select
                    required
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="">Select requesting employee...</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.first_name} {e.last_name} ({e.job_title})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Leave Type */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Leave Type *
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="annual">Annual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="maternity">Maternity / Paternity</option>
                    <option value="unpaid">Unpaid Leave</option>
                  </select>
                </div>

                {/* Date Ranges */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Reason for Absence *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide context or explanation for the request (at least 5 characters)..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* Actions */}
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
                    <span>Submit Request</span>
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
