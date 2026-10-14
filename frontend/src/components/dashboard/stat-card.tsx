"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change: {
    value: string;
    isPositive: boolean;
  };
  supportingLabel: string;
  iconBg?: string;
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  supportingLabel,
  iconBg = "bg-indigo-50",
  iconColor = "text-indigo-600",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            iconBg
          )}
        >
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-3xl font-bold tracking-tight text-slate-900 font-heading">
          {value}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 font-semibold",
            change.isPositive ? "text-emerald-600" : "text-rose-600"
          )}
        >
          {change.isPositive ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {change.value}
        </span>
        <span className="text-slate-400 font-normal">
          {supportingLabel}
        </span>
      </div>
    </div>
  );
}
