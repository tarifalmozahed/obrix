"use client";

import { useState } from "react";
import {
  Clock,
  Plus,
  Trash2,
  Loader2,
  X,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Shift } from "@/types/hrms";
import { createShift, deleteShift } from "@/lib/hrms";

interface ShiftsTableProps {
  shifts: Shift[];
  orgId: string;
  loading: boolean;
  onRefresh: () => void;
}

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function ShiftsTable({
  shifts,
  orgId,
  loading,
  onRefresh,
}: ShiftsTableProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState("15");
  const [breakDurationMinutes, setBreakDurationMinutes] = useState("60");
  const [workDays, setWorkDays] = useState<string[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ]);
  const [isDefault, setIsDefault] = useState(false);
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setCode("");
    setStartTime("09:00");
    setEndTime("18:00");
    setGracePeriodMinutes("15");
    setBreakDurationMinutes("60");
    setWorkDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    setIsDefault(false);
    setDescription("");
    setIsDrawerOpen(false);
    setFormError(null);
  };

  const toggleDay = (day: string) => {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Shift name is required.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await createShift(orgId, {
        name: name.trim(),
        code: code.trim() || undefined,
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
        end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
        grace_period_minutes: parseInt(gracePeriodMinutes, 10) || 15,
        break_duration_minutes: parseInt(breakDurationMinutes, 10) || 60,
        work_days: workDays,
        is_default: isDefault,
        description: description.trim() || undefined,
      });

      if (res.success) {
        resetForm();
        onRefresh();
      } else {
        setFormError(res.error?.message || "Failed to create shift schedule.");
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create shift schedule.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this shift schedule?")) return;
    setDeletingId(id);
    try {
      const res = await deleteShift(orgId, id);
      if (res.success) {
        onRefresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 font-heading">
            Work Shifts & Rosters
          </h2>
          <p className="text-xs text-slate-500">
            Define daily operating hours, grace margins, break allowances, and working schedules
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Shift</span>
        </button>
      </div>

      {/* Main Table Card Shell */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Shift Name</th>
                <th className="py-3 px-4">Hours (Start - End)</th>
                <th className="py-3 px-4">Grace & Breaks</th>
                <th className="py-3 px-4">Active Work Days</th>
                <th className="py-3 px-4">Default Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading shift rosters...</span>
                    </div>
                  </td>
                </tr>
              ) : shifts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                        <Clock className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-slate-800 text-xs">No shifts configured</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Set standard timings such as 09:00 AM - 06:00 PM to power attendance calculations.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsDrawerOpen(true)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Default Day Shift</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                shifts.map((sh) => (
                  <tr key={sh.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{sh.name}</div>
                          {sh.code && (
                            <span className="font-mono text-[10px] text-slate-400">
                              {sh.code}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {sh.start_time?.slice(0, 5)} — {sh.end_time?.slice(0, 5)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>Grace: {sh.grace_period_minutes}m</div>
                      <div className="text-[10px] text-slate-400">Break: {sh.break_duration_minutes}m</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 flex-wrap max-w-xs">
                        {sh.work_days?.map((d) => (
                          <span
                            key={d}
                            className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600"
                          >
                            {d.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {sh.is_default ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Default Shift</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        disabled={deletingId === sh.id}
                        onClick={() => handleDelete(sh.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Shift"
                      >
                        {deletingId === sh.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-Over Drawer: Add Shift */}
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
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-heading">New Shift Schedule</h3>
                    <p className="text-[11px] text-slate-400">Configure hours, grace allowance, and work days</p>
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

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Shift Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Regular Day Shift"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Code
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="DAY-01"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      End Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Grace Period (Minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={gracePeriodMinutes}
                      onChange={(e) => setGracePeriodMinutes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Break Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={breakDurationMinutes}
                      onChange={(e) => setBreakDurationMinutes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                    Working Days
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ALL_DAYS.map((day) => {
                      const selected = workDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                            selected
                              ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isDefaultShift"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <label htmlFor="isDefaultShift" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Set as default organization shift
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Teams assigned, special handover notes..."
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
                    <span>Save Shift</span>
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
