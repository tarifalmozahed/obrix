"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Users, ContactRound, FolderKanban, Calculator, ChevronDown } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showCreateButton?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  showCreateButton = true,
}: PageHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (label: string) => {
    setNotification(`${label} action triggered`);
    setMenuOpen(false);
    setTimeout(() => setNotification(null), 3000);
  };

  const actionItems = [
    { label: "New Employee", icon: Users, module: "HRMS" },
    { label: "New Deal / Lead", icon: ContactRound, module: "CRM" },
    { label: "New Project", icon: FolderKanban, module: "Projects" },
    { label: "New Invoice", icon: Calculator, module: "Accounting" },
  ];

  return (
    <div className="relative mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 font-normal">
            {subtitle}
          </p>
        )}
      </div>

      {showCreateButton && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 active:bg-indigo-800"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Create New</span>
            <ChevronDown className="h-3.5 w-3.5 text-indigo-200" />
          </button>

          {/* Quick Create Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-30 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Quick Actions
              </div>
              {actionItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleAction(item.label)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <span>{item.label}</span>
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 rounded bg-slate-100 px-1.5 py-0.5">
                      {item.module}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Action Toast Feedback */}
          {notification && (
            <div className="absolute right-0 top-full mt-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 shadow-sm z-30">
              {notification} (Demo)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
