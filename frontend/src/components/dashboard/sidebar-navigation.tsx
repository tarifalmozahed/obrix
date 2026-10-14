"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ContactRound,
  FolderKanban,
  Calculator,
  Settings,
  CircleUserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const mainNavItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "HRMS", href: "/dashboard/hrms", icon: Users },
  { name: "CRM", href: "/dashboard/crm", icon: ContactRound },
  { name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { name: "Accounting", href: "/dashboard/accounting", icon: Calculator },
];

export const bottomNavItems = [
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Profile", href: "/dashboard/profile", icon: CircleUserRound },
];

interface SidebarNavigationProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNavigation({ collapsed = false, onNavigate }: SidebarNavigationProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const renderNavGroup = (items: typeof mainNavItems) => (
    <div className="space-y-1">
      {items.map((item) => {
        const active = isItemActive(item.href);
        const Icon = item.icon;

        return (
          <div key={item.href} className="relative group">
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors relative",
                active
                  ? "bg-indigo-50/80 text-indigo-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70",
                collapsed && "justify-center px-2 py-2.5"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  active ? "text-indigo-600" : "text-slate-500 group-hover:text-slate-800"
                )}
              />
              {!collapsed && <span>{item.name}</span>}

              {/* Active Indicator bar */}
              {active && !collapsed && (
                <div className="absolute right-0 top-1.5 bottom-1.5 w-1 bg-indigo-600 rounded-l" />
              )}
            </Link>

            {/* Floating Tooltip when collapsed */}
            {collapsed && (
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                {item.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col justify-between py-2">
      <div className="space-y-4">
        {!collapsed && (
          <div className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu
          </div>
        )}
        {renderNavGroup(mainNavItems)}
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-200/80">
        {!collapsed && (
          <div className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Preferences
          </div>
        )}
        {renderNavGroup(bottomNavItems)}
      </div>
    </div>
  );
}
