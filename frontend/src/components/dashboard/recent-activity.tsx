"use client";

import {
  Users,
  ContactRound,
  FolderKanban,
  Calculator,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  module: "HRMS" | "CRM" | "Projects" | "Accounting";
  timestamp: string;
  icon: typeof Users;
  iconBg: string;
  iconColor: string;
}

const sampleActivities: ActivityItem[] = [
  {
    id: "act-1",
    title: "New Employee Onboarded",
    description: "Sarah Jenkins completed onboarding as Senior Product Designer.",
    module: "HRMS",
    timestamp: "25m ago",
    icon: Users,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: "act-2",
    title: "Deal Stage Updated",
    description: "Enterprise Cloud Pilot ($48,000) moved to Proposal Review.",
    module: "CRM",
    timestamp: "2h ago",
    icon: ContactRound,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    id: "act-3",
    title: "Project Milestone Reached",
    description: "Phase 2 Mobile Architecture completed on-schedule.",
    module: "Projects",
    timestamp: "4h ago",
    icon: FolderKanban,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    id: "act-4",
    title: "Client Payment Received",
    description: "Invoice #INV-2026-089 paid in full ($14,250) by Vertex Corp.",
    module: "Accounting",
    timestamp: "Yesterday",
    icon: Calculator,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
];

export function RecentActivity() {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-module organizational updates and events.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
          Sample Feed
        </span>
      </div>

      {/* Activity Timeline List */}
      <div className="flex-1 space-y-4">
        {sampleActivities.map((act, index) => {
          const Icon = act.icon;
          const isLast = index === sampleActivities.length - 1;

          return (
            <div key={act.id} className="relative flex items-start gap-3">
              {/* Vertical connecting line */}
              {!isLast && (
                <div className="absolute left-4 top-8 bottom-0 w-px bg-slate-200/80 -translate-x-1/2" />
              )}

              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-xs",
                  act.iconBg
                )}
              >
                <Icon className={cn("h-4 w-4", act.iconColor)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {act.title}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 rounded bg-slate-100 px-1.5 py-0.5">
                      {act.module}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {act.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {act.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Link */}
      <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-end">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <span>View all activity logs</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
