"use client";

import { useState } from "react";
import {
  Clock,
  Search,
  Plus,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  X,
  LogIn,
  LogOut,
} from "lucide-react";
import { AttendanceRecord, Employee } from "@/types/hrms";
import { apiRequest } from "@/lib/api";
import { createClient } from "@/lib/supabase";

interface AttendanceTableProps {
  records: AttendanceRecord[];
  employees: Employee[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  orgId: string;
  loading: boolean;
  onRefresh: () => void;
}

export function AttendanceTable({
  records,
  employees,
  selectedDate,
  onDateChange,
  orgId,
  loading,
  onRefresh,
}: AttendanceTableProps) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"clock_in" | "clock_out">("clock_in");
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = records.filter((rec) => {
    const emp = rec.employees;
    if (!emp) return true;
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    return (
      fullName.includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.job_title.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Calculate day metrics
  const presentCount = records.filter((r) => r.status === "present").length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const halfDayCount = records.filter((r) => r.status === "half_day").length;
  const absentCount = records.filter((r) => r.status === "absent").length;

  const navigateDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    onDateChange(current.toISOString().split("T")[0]);
  };

  const calculateHours = (inTime: string, outTime?: string | null) => {
    if (!outTime) return "In progress";
    const start = new Date(inTime).getTime();
    const end = new Date(outTime).getTime();
    const diffMs = end - start;
    if (diffMs <= 0) return "0 hrs";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return "—";
    try {
      return new Date(timeStr).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return timeStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Present
          </span>
        );
      case "late":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Late
          </span>
        );
      case "half_day":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            Half Day
          </span>
        );
      case "absent":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Absent
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

  const handleRecordAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) {
      setFormError("Please select an employee.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const endpoint =
        modalMode === "clock_in"
          ? "/hrms/attendance/clock-in"
          : "/hrms/attendance/clock-out";

      const res = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({
          employeeId: selectedEmpId,
          notes: notes || undefined,
        }),
      }, orgId);

      if (res.success) {
        resetForm();
        onRefresh();
        return;
      }

      // Direct Supabase fallback
      const supabase = createClient();
      const today = selectedDate || new Date().toISOString().split("T")[0];

      if (modalMode === "clock_in") {
        const { error: sbError } = await supabase.from("attendance").insert({
          organization_id: orgId,
          employee_id: selectedEmpId,
          date: today,
          clock_in: new Date().toISOString(),
          status: "present",
          notes: notes || null,
        });
        if (sbError) throw sbError;
      } else {
        const { error: sbError } = await supabase
          .from("attendance")
          .update({ clock_out: new Date().toISOString() })
          .eq("organization_id", orgId)
          .eq("employee_id", selectedEmpId)
          .eq("date", today);
        if (sbError) throw sbError;
      }

      resetForm();
      onRefresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error recording attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedEmpId("");
    setNotes("");
    setIsModalOpen(false);
    setFormError(null);
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
      {/* Date Navigation & Actions Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/40">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Picker Controls */}
          <div className="inline-flex items-center gap-1 p-1 rounded-lg border border-slate-200 bg-white shadow-2xs">
            <button
              type="button"
              onClick={() => navigateDate(-1)}
              title="Previous Day"
              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent px-1 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => navigateDate(1)}
              title="Next Day"
              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onDateChange(new Date().toISOString().split("T")[0])}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            Today
          </button>

          {/* Quick Metrics */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
            <span className="text-slate-500">
              <strong className="text-emerald-700 font-bold">{presentCount}</strong> Present
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">
              <strong className="text-amber-700 font-bold">{lateCount}</strong> Late
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">
              <strong className="text-rose-700 font-bold">{absentCount}</strong> Absent
            </span>
          </div>
        </div>

        {/* Search & Record Actions */}
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search record..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setModalMode("clock_in");
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors shrink-0"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Clock In / Out</span>
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Clock In</th>
              <th className="py-3 px-4">Clock Out</th>
              <th className="py-3 px-4">Total Time</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Loading attendance logs for {selectedDate}...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                      <Clock className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-slate-800 text-xs">No attendance logs for this date</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No clock-in events have been recorded for {selectedDate}.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setModalMode("clock_in");
                        setIsModalOpen(true);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record Clock In</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((rec) => {
                const emp = rec.employees;
                const initials = emp ? `${emp.first_name?.[0] || ""}${emp.last_name?.[0] || ""}`.toUpperCase() : "E";
                const hoursWorked = calculateHours(rec.clock_in, rec.clock_out);

                return (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
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
                            {emp?.job_title || emp?.email || "Employee"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Clock In */}
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {formatTime(rec.clock_in)}
                    </td>

                    {/* Clock Out */}
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {rec.clock_out ? (
                        formatTime(rec.clock_out)
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          On Shift
                        </span>
                      )}
                    </td>

                    {/* Working Hours */}
                    <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                      {hoursWorked}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">{getStatusBadge(rec.status)}</td>

                    {/* Notes */}
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {rec.notes || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer: Clock In / Out Action */}
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
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-heading">Record Attendance</h3>
                    <p className="text-[11px] text-slate-400">Log employee daily shift clock times</p>
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

              <form onSubmit={handleRecordAttendance} className="p-6 flex-1 overflow-y-auto space-y-4">
                {formError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                    {formError}
                  </div>
                )}

                {/* Mode Toggle: Clock In vs Clock Out */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                    Action Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setModalMode("clock_in")}
                      className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        modalMode === "clock_in"
                          ? "bg-white text-indigo-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Clock In</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalMode("clock_out")}
                      className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        modalMode === "clock_out"
                          ? "bg-white text-indigo-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <LogOut className="w-3.5 h-3.5 text-amber-600" />
                      <span>Clock Out</span>
                    </button>
                  </div>
                </div>

                {/* Select Employee */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Select Employee *
                  </label>
                  <select
                    required
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="">Choose an employee...</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.first_name} {e.last_name} — {e.job_title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Shift Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Remote shift, client onsite..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500"
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
                    <span>{modalMode === "clock_in" ? "Confirm Clock In" : "Confirm Clock Out"}</span>
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
