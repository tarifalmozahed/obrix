import { LucideIcon, Construction } from "lucide-react";
import Link from "next/link";

interface PlaceholderModuleProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function PlaceholderModule({
  title,
  description,
  icon: Icon = Construction,
}: PlaceholderModuleProps) {
  return (
    <div className="space-y-6">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      {/* Under Development Empty State */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 px-6 text-center shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-4">
          <Icon className="h-6 w-6" />
        </div>
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 mb-2 border border-amber-200/60">
          Under Development
        </span>
        <h2 className="text-lg font-bold text-slate-900">
          {title} Module Coming Soon
        </h2>
        <p className="mt-1.5 max-w-md text-xs text-slate-500">
          This ERP module is currently under active development. Functional records and operations will be connected in an upcoming release.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors"
          >
            Back to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
