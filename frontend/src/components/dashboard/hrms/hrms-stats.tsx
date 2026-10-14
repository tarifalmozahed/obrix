"use client";

import { Users, Building2, Clock, CalendarCheck } from "lucide-react";
import { HRMSStats } from "@/types/hrms";

interface HRMSStatsCardsProps {
  stats: HRMSStats | null;
  loading: boolean;
}

export function HRMSStatsCards({ stats, loading }: HRMSStatsCardsProps) {
  const totalEmployees = stats?.totalEmployees ?? 0;
  const activeEmployees = stats?.activeEmployees ?? 0;
  const totalDepartments = stats?.totalDepartments ?? 0;
  const presentToday = stats?.presentToday ?? 0;
  const onLeaveToday = stats?.onLeaveToday ?? 0;

  const attendanceRate =
    totalEmployees > 0
      ? Math.round((presentToday / totalEmployees) * 100)
      : 0;

  const cards = [
    {
      title: "Total Workforce",
      value: loading ? "..." : String(totalEmployees),
      subtext: `${activeEmployees} Active on Payroll`,
      icon: Users,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      borderColor: "border-blue-100",
    },
    {
      title: "Active Departments",
      value: loading ? "..." : String(totalDepartments),
      subtext: "Functional Divisions",
      icon: Building2,
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      borderColor: "border-indigo-100",
    },
    {
      title: "Present Today",
      value: loading ? "..." : String(presentToday),
      subtext: `${attendanceRate}% Attendance Rate`,
      icon: Clock,
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      borderColor: "border-emerald-100",
    },
    {
      title: "On Leave Today",
      value: loading ? "..." : String(onLeaveToday),
      subtext: "Approved Out of Office",
      icon: CalendarCheck,
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
      borderColor: "border-amber-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.bgColor} ${card.textColor} border ${card.borderColor}`}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {card.value}
              </span>
              <p className="mt-1 text-[11px] font-medium text-slate-400">
                {card.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
