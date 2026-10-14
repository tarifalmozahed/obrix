"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Loader2,
  RefreshCw,
  UserPlus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  MoreHorizontal,
  Trash2,
  Sparkles,
  ShieldCheck,
  FileText,
  UserCheck,
  Building2,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Department, Employee } from "@/types/hrms";
import { EmployeeOnboarding } from "@/types/onboarding";
import { OnboardingWizard } from "./onboarding-wizard";
import {
  fetchOnboardings,
  deleteOnboardingRecord,
  activateOnboardingEmployee,
} from "@/lib/onboarding";
import { cn } from "@/lib/utils";

interface OnboardingListProps {
  onboardings: EmployeeOnboarding[];
  departments: Department[];
  employees: Employee[];
  orgId: string;
  loading: boolean;
  onRefresh: () => void;
}

export function OnboardingList({
  onboardings,
  departments,
  employees,
  orgId,
  loading,
  onRefresh,
}: OnboardingListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOnboarding, setSelectedOnboarding] = useState<EmployeeOnboarding | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filter onboardings
  const filteredOnboardings = useMemo(() => {
    return onboardings.filter((o) => {
      const p = o.personalInfo || o.personal_info || {};
      const e = o.employmentInfo || o.employment_info || {};
      const fullName = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
      const code = (e.employeeCode || "").toLowerCase();
      const email = (p.personalEmail || e.workEmail || "").toLowerCase();
      const role = (e.designation || "").toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        code.includes(q) ||
        email.includes(q) ||
        role.includes(q);

      const matchesStatus =
        statusFilter === "all" || o.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [onboardings, searchQuery, statusFilter]);

  // Metric counts
  const totalCount = onboardings.length;
  const draftCount = onboardings.filter((o) => o.status === "draft").length;
  const reviewCount = onboardings.filter((o) => o.status === "in_review" || o.status === "changes_requested").length;
  const approvedCount = onboardings.filter((o) => o.status === "approved").length;
  const completedCount = onboardings.filter((o) => o.status === "completed").length;

  // Handle Quick Activation
  const handleQuickActivate = async (id: string) => {
    if (!confirm("Are you sure you want to activate this candidate into an official active employee?")) {
      return;
    }
    setActionLoadingId(id);
    setActionError(null);
    try {
      const res = await activateOnboardingEmployee(id, orgId);
      if (res.success) {
        setActionSuccess("Employee successfully activated and staff directory updated!");
        onRefresh();
      } else {
        setActionError(res.error?.message || "Activation failed");
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Error activating employee");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Delete Draft
  const handleDeleteDraft = async (id: string) => {
    if (!confirm("Are you sure you want to delete this onboarding record? This cannot be undone.")) {
      return;
    }
    setActionLoadingId(id);
    setActionError(null);
    try {
      const res = await deleteOnboardingRecord(id, orgId);
      if (res.success) {
        onRefresh();
      } else {
        setActionError(res.error?.message || "Failed to delete record");
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Error deleting record");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            <Clock className="w-3 h-3 text-amber-500" />
            Draft Setup
          </span>
        );
      case "in_review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
            <ShieldCheck className="w-3 h-3 text-blue-500" />
            In Review
          </span>
        );
      case "changes_requested":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
            <AlertTriangle className="w-3 h-3 text-purple-500" />
            Changes Requested
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Approved · Ready
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/60">
            <UserCheck className="w-3 h-3 text-teal-600" />
            Activated Staff
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Notifications */}
      {actionSuccess && (
        <div className="flex items-center justify-between p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-xs text-emerald-700 hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center justify-between p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-xs text-rose-700 hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Total Pipeline
          </div>
          <div className="mt-1 text-2xl font-bold font-serif text-slate-900 tracking-tight">
            {totalCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Onboarding records</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-medium text-amber-600 uppercase tracking-wider">
            In Draft
          </div>
          <div className="mt-1 text-2xl font-bold font-serif text-amber-900 tracking-tight">
            {draftCount}
          </div>
          <div className="text-[11px] text-amber-600/70 mt-0.5">Wizard in progress</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-medium text-blue-600 uppercase tracking-wider">
            Under Review
          </div>
          <div className="mt-1 text-2xl font-bold font-serif text-blue-900 tracking-tight">
            {reviewCount}
          </div>
          <div className="text-[11px] text-blue-600/70 mt-0.5">Awaiting approvals</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">
            Approved
          </div>
          <div className="mt-1 text-2xl font-bold font-serif text-emerald-900 tracking-tight">
            {approvedCount}
          </div>
          <div className="text-[11px] text-emerald-600/70 mt-0.5">Ready for activation</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-medium text-teal-600 uppercase tracking-wider">
            Completed
          </div>
          <div className="mt-1 text-2xl font-bold font-serif text-teal-900 tracking-tight">
            {completedCount}
          </div>
          <div className="text-[11px] text-teal-600/70 mt-0.5">Active employees</div>
        </div>
      </div>

      {/* Action Bar / Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate, code, email, designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filter Tabs & Action Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/60 text-xs">
            {[
              { id: "all", label: "All" },
              { id: "draft", label: "Drafts" },
              { id: "in_review", label: "Review" },
              { id: "approved", label: "Approved" },
              { id: "completed", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
                  statusFilter === tab.id
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Refresh onboardings"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-blue-600")} />
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedOnboarding(null);
              setIsWizardOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Candidate</span>
          </button>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading && onboardings.length === 0 ? (
          <div className="py-20 text-center">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Loading onboarding pipeline...</p>
          </div>
        ) : filteredOnboardings.length === 0 ? (
          <div className="py-16 text-center">
            <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No onboarding candidates found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "No candidates match your current search or filter criteria."
                : "Kickstart your hiring process with the 7-step Employee Onboarding Wizard."}
            </p>
            <button
              onClick={() => {
                setSelectedOnboarding(null);
                setIsWizardOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Start Onboarding Candidate</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Candidate & Identity</th>
                  <th className="py-3 px-4">Role & Department</th>
                  <th className="py-3 px-4">Onboarding Step & Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Target Joining</th>
                  <th className="py-3 px-4 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredOnboardings.map((candidate) => {
                  const p = candidate.personalInfo || candidate.personal_info || {};
                  const e = candidate.employmentInfo || candidate.employment_info || {};
                  const dept = departments.find((d) => d.id === e.departmentId);
                  const fullName =
                    `${p.firstName || ""} ${p.middleName || ""} ${p.lastName || ""}`.trim() ||
                    "Unnamed Candidate";
                  const stepNumber = candidate.currentStep || candidate.current_step || 1;
                  const progressPct = candidate.progress || 14;

                  return (
                    <tr
                      key={candidate.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* 1. Candidate Identity */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {p.profilePhotoUrl ? (
                            <img
                              src={p.profilePhotoUrl}
                              alt={fullName}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                              {p.firstName ? p.firstName[0].toUpperCase() : "U"}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                              {fullName}
                              {candidate.status === "completed" && (
                                <span title="Activated Official Employee">
                                  <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span className="font-mono text-slate-600">
                                {e.employeeCode || "CODE PENDING"}
                              </span>
                              <span>·</span>
                              <span>{p.personalEmail || e.workEmail || "No email"}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Role & Department */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {e.designation || "Designation Pending"}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{dept?.name || "Unassigned Dept"}</span>
                          {e.employmentType && (
                            <>
                              <span>·</span>
                              <span className="capitalize">{e.employmentType}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* 3. Progress & Steps */}
                      <td className="py-3 px-4">
                        <div className="w-44">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-slate-600 font-medium">
                              Step {stepNumber} of 7
                            </span>
                            <span className="font-bold text-slate-900">{progressPct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                candidate.status === "completed"
                                  ? "bg-teal-500"
                                  : candidate.status === "approved"
                                  ? "bg-emerald-500"
                                  : "bg-blue-600"
                              )}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 4. Status Badge */}
                      <td className="py-3 px-4">{getStatusBadge(candidate.status)}</td>

                      {/* 5. Target Joining Date */}
                      <td className="py-3 px-4 text-[11px] text-slate-600">
                        {e.joiningDate ? (
                          <div className="font-medium text-slate-800">
                            {new Date(e.joiningDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not scheduled</span>
                        )}
                      </td>

                      {/* 6. Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Resume / View in Wizard */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOnboarding(candidate);
                              setIsWizardOpen(true);
                            }}
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                              candidate.status === "approved"
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                : candidate.status === "draft"
                                ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                            )}
                          >
                            <span>
                              {candidate.status === "completed"
                                ? "View File"
                                : candidate.status === "approved"
                                ? "Activate"
                                : candidate.status === "draft"
                                ? "Resume"
                                : "Review"}
                            </span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          {/* Quick Activate Button for Approved */}
                          {candidate.status === "approved" && (
                            <button
                              type="button"
                              onClick={() => handleQuickActivate(candidate.id)}
                              disabled={actionLoadingId === candidate.id}
                              className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                              title="One-click Final Activation"
                            >
                              {actionLoadingId === candidate.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Delete for Drafts */}
                          {candidate.status === "draft" && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDraft(candidate.id)}
                              disabled={actionLoadingId === candidate.id}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Draft"
                            >
                              {actionLoadingId === candidate.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7-Step Onboarding Wizard Modal */}
      {isWizardOpen && (
        <OnboardingWizard
          organizationId={orgId}
          departments={departments}
          employees={employees}
          initialData={selectedOnboarding}
          onClose={() => {
            setIsWizardOpen(false);
            setSelectedOnboarding(null);
          }}
          onComplete={() => {
            setIsWizardOpen(false);
            setSelectedOnboarding(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
