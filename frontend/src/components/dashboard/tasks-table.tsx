"use client";

import { useState } from "react";
import { CheckCircle2, Clock, AlertCircle, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskItem {
  id: string;
  name: string;
  module: "HRMS" | "CRM" | "Projects" | "Accounting";
  dueDate: string;
  status: "Completed" | "In Progress" | "Pending Review" | "Upcoming";
  priority: "High" | "Medium" | "Low";
}

const initialTasks: TaskItem[] = [
  {
    id: "task-1",
    name: "Complete Q4 Employee Performance Appraisals",
    module: "HRMS",
    dueDate: "Oct 18, 2026",
    status: "In Progress",
    priority: "High",
  },
  {
    id: "task-2",
    name: "Finalize Contract Agreement for Orbix Retail Deal",
    module: "CRM",
    dueDate: "Oct 20, 2026",
    status: "Pending Review",
    priority: "High",
  },
  {
    id: "task-3",
    name: "Migrate Cloud Infrastructure to Multi-Region Cluster",
    module: "Projects",
    dueDate: "Oct 24, 2026",
    status: "In Progress",
    priority: "Medium",
  },
  {
    id: "task-4",
    name: "Reconcile September Monthly Ledger Statements",
    module: "Accounting",
    dueDate: "Oct 15, 2026",
    status: "Completed",
    priority: "Medium",
  },
  {
    id: "task-5",
    name: "Submit Annual Corporate Tax Compliance Filing",
    module: "Accounting",
    dueDate: "Nov 01, 2026",
    status: "Upcoming",
    priority: "Low",
  },
];

export function TasksTable() {
  const [tasks] = useState<TaskItem[]>(initialTasks);
  const [filterModule, setFilterModule] = useState<string>("All");

  const filteredTasks =
    filterModule === "All"
      ? tasks
      : tasks.filter((t) => t.module === filterModule);

  const getStatusBadge = (status: TaskItem["status"]) => {
    switch (status) {
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </span>
        );
      case "In Progress":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
            <Clock className="h-3 w-3" />
            In Progress
          </span>
        );
      case "Pending Review":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
            <AlertCircle className="h-3 w-3" />
            Pending Review
          </span>
        );
      case "Upcoming":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
            Upcoming
          </span>
        );
    }
  };

  const getModuleBadge = (module: TaskItem["module"]) => {
    const styles: Record<TaskItem["module"], string> = {
      HRMS: "bg-blue-50 text-blue-700 border-blue-200/60",
      CRM: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
      Projects: "bg-amber-50 text-amber-700 border-amber-200/60",
      Accounting: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    };

    return (
      <span
        className={cn(
          "inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold",
          styles[module]
        )}
      >
        {module}
      </span>
    );
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">My Tasks</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              Demo Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational action items requiring attention across company modules.
          </p>
        </div>

        {/* Module Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {["All", "HRMS", "CRM", "Projects", "Accounting"].map((mod) => (
            <button
              key={mod}
              type="button"
              onClick={() => setFilterModule(mod)}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium transition-colors whitespace-nowrap",
                filterModule === mod
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th scope="col" className="pb-3 pl-1">
                Task Name
              </th>
              <th scope="col" className="pb-3 px-3">
                Module
              </th>
              <th scope="col" className="pb-3 px-3">
                Due Date
              </th>
              <th scope="col" className="pb-3 px-3">
                Status
              </th>
              <th scope="col" className="pb-3 pr-1 text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTasks.map((task) => (
              <tr
                key={task.id}
                className="group hover:bg-slate-50/60 transition-colors"
              >
                <td className="py-3.5 pl-1 pr-3">
                  <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {task.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Priority:{" "}
                    <span
                      className={
                        task.priority === "High"
                          ? "text-rose-600 font-medium"
                          : "text-slate-500 font-medium"
                      }
                    >
                      {task.priority}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-3 whitespace-nowrap">
                  {getModuleBadge(task.module)}
                </td>
                <td className="py-3.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                  {task.dueDate}
                </td>
                <td className="py-3.5 px-3 whitespace-nowrap">
                  {getStatusBadge(task.status)}
                </td>
                <td className="py-3.5 pr-1 text-right whitespace-nowrap">
                  <button
                    type="button"
                    aria-label={`Options for ${task.name}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
