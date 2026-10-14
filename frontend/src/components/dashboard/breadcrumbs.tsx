"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const routeLabels: Record<string, string> = {
  dashboard: "Overview",
  hrms: "HRMS",
  crm: "CRM",
  projects: "Projects",
  accounting: "Accounting",
  settings: "Settings",
  profile: "Profile",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs text-slate-500">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="sr-only">Home</span>
      </Link>

      {segments.map((seg, idx) => {
        const isLast = idx === segments.length - 1;
        const href = "/" + segments.slice(0, idx + 1).join("/");
        const label = routeLabels[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);

        return (
          <div key={href} className="flex items-center space-x-1.5">
            <ChevronRight className="w-3 h-3 text-slate-400" />
            {isLast ? (
              <span className="font-semibold text-slate-900">{label}</span>
            ) : (
              <Link href={href} className="hover:text-slate-800 transition-colors">
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
