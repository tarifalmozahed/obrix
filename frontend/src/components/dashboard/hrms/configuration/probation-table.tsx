"use client";

import { useState } from "react";
import {
  Hourglass,
  Plus,
  Trash2,
  Loader2,
  X,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { ProbationDuration } from "@/types/hrms";
import { createProbationDuration, deleteProbationDuration } from "@/lib/hrms";

interface ProbationTableProps {
  policies: ProbationDuration[];
  orgId: string;
  loading: boolean;
  onRefresh: () => void;
}

export function ProbationTable({
  policies,
  orgId,
  loading,
  onRefresh,
}: ProbationTableProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [durationMonths, setDurationMonths] = useState("3");
  const [evaluationFrequency, setEvaluationFrequency] = useState("Monthly");
  const [noticePeriodDays, setNoticePeriodDays] = useState("14");
  const [isDefault, setIsDefault] = useState(false);
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setDurationMonths("3");
    setEvaluationFrequency("Monthly");
    setNoticePeriodDays("14");
    setIsDefault(false);
    setDescription("");
    setIsDrawerOpen(false);
    setFormError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Policy title is required.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await createProbationDuration(orgId, {
        title: title.trim(),
        duration_months: parseInt(durationMonths, 10) || 3,
        evaluation_frequency: evaluationFrequency,
        notice_period_days: parseInt(noticePeriodDays, 10) || 14,
        is_default: isDefault,
        description: description.trim() || undefined,
      });

      if (res.success) {
        resetForm();
        onRefresh();
      } else {
        setFormError(res.error?.message || "Failed to create probation duration policy.");
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create probation policy.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this probation policy?")) return;
    setDeletingId(id);
    try {
      const res = await deleteProbationDuration(orgId, id);
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
            Probation Duration & Review Policies
          </h2>
          <p className="text-xs text-slate-500">
            Configure default probationary timelines, check-in cadences, and exit notice periods
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Policy</span>
        </button>
      </div>

      {/* Main Table Card Shell */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Policy Title</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Evaluation Cadence</th>
                <th className="py-3 px-4">Notice Period</th>
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
                      <span>Loading probation policies...</span>
                    </div>
                  </td>
                </tr>
              ) : policies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                        <Hourglass className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-slate-800 text-xs">No probation policies configured</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Set standard durations like 3 Months or 6 Months for candidate onboarding.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsDrawerOpen(true)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Default 3-Month Policy</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                policies.map((pol) => (
                  <tr key={pol.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                          <Hourglass className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{pol.title}</div>
                          {pol.description && (
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">
                              {pol.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800">
                        {pol.duration_months} {pol.duration_months === 1 ? "Month" : "Months"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {pol.evaluation_frequency || "Monthly"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {pol.notice_period_days} Days
                    </td>
                    <td className="py-3 px-4">
                      {pol.is_default ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Default Policy</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        disabled={deletingId === pol.id}
                        onClick={() => handleDelete(pol.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Policy"
                      >
                        {deletingId === pol.id ? (
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

      {/* Slide-Over Drawer: Add Probation Policy */}
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
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                    <Hourglass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-heading">
                      New Probation Duration Policy
                    </h3>
                    <p className="text-[11px] text-slate-400">Configure duration and review expectations</p>
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
                    Policy Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Standard Full-Time (3 Months)"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Duration (Months) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      required
                      value={durationMonths}
                      onChange={(e) => setDurationMonths(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Notice Period (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={noticePeriodDays}
                      onChange={(e) => setNoticePeriodDays(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Evaluation Cadence
                  </label>
                  <select
                    value={evaluationFrequency}
                    onChange={(e) => setEvaluationFrequency(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Monthly">Monthly Check-ins</option>
                    <option value="Bi-weekly">Bi-weekly Check-ins</option>
                    <option value="Mid-term & Final">Mid-term & Final Only</option>
                    <option value="Final Review Only">Final Review Only</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isDefaultPolicy"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <label htmlFor="isDefaultPolicy" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Set as default probation policy for new hires
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
                    placeholder="Evaluation criteria, performance KPIs..."
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
                    <span>Save Policy</span>
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
