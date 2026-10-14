"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutGrid,
  Users,
  Building2,
  Clock,
  CalendarCheck,
  ContactRound,
  FolderKanban,
  Calculator,
  Settings,
  CircleUserRound,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  UserPlus,
  Hourglass,
  Briefcase,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavSubItem {
  name: string;
  href: string;
  tabKey?: string;
  badge?: string;
  badgeType?: "coral" | "mint" | "slate";
  icon?: LucideIcon;
}

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeType?: "coral" | "mint" | "slate";
  subItems?: NavSubItem[];
}

export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export const navigationGroups: NavGroup[] = [
  {
    id: "main",
    title: "General",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutGrid,
      },
    ],
  },
  {
    id: "hrms",
    title: "HRMS",
    items: [
      {
        name: "Onboarding",
        href: "/hrms/onboarding",
        icon: UserPlus,
        badge: "New",
        badgeType: "mint",
      },
      {
        name: "Staff",
        href: "/hrms/staff",
        icon: Users,
      },
      {
        name: "Department",
        href: "/hrms/departments",
        icon: Building2,
      },
      {
        name: "Attendance",
        href: "/hrms/attendance",
        icon: Clock,
        badge: "98%",
        badgeType: "mint",
      },
      {
        name: "Leave Request",
        href: "/hrms/leave-requests",
        icon: CalendarCheck,
        badge: "3",
        badgeType: "coral",
      },
      {
        name: "Configuration",
        href: "/hrms/configuration/positions",
        icon: Settings,
        subItems: [
          {
            name: "Position / Designation",
            href: "/hrms/configuration/positions",
            icon: Briefcase,
          },
          {
            name: "Probation Duration",
            href: "/hrms/configuration/probation",
            icon: Hourglass,
          },
          {
            name: "Shift Rosters",
            href: "/hrms/configuration/shifts",
            icon: Clock,
          },
        ],
      },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    items: [
      {
        name: "CRM",
        href: "/crm",
        icon: ContactRound,
        badge: "Soon",
        badgeType: "slate",
      },
      {
        name: "Projects",
        href: "/projects",
        icon: FolderKanban,
        badge: "Soon",
        badgeType: "slate",
      },
      {
        name: "Accounting",
        href: "/accounting",
        icon: Calculator,
        badge: "Soon",
        badgeType: "slate",
      },
    ],
  },
  {
    id: "system",
    title: "Preferences",
    items: [
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
      },
      {
        name: "Profile",
        href: "/profile",
        icon: CircleUserRound,
      },
    ],
  },
];

interface SidebarNavigationProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

function SidebarNavigationContent({ collapsed = false, onNavigate }: SidebarNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "employees";

  // Manage expanded sub-menus (auto-expand Configuration if on configuration page)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    Configuration: true,
  });

  useEffect(() => {
    if (pathname.startsWith("/hrms/configuration")) {
      setExpandedItems((prev) => ({ ...prev, Configuration: true }));
    }
  }, [pathname]);

  const toggleExpand = (itemName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItems((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  const isItemActive = (item: NavItem) => {
    if (item.href === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (item.subItems && item.subItems.length > 0) {
      return item.subItems.some((sub) => pathname === sub.href || pathname.startsWith(sub.href + "/"));
    }
    return pathname === item.href || (item.href !== "/hrms" && pathname.startsWith(item.href + "/"));
  };

  const isSubItemActive = (subItem: NavSubItem) => {
    return pathname === subItem.href || pathname.startsWith(subItem.href + "/");
  };

  const renderBadge = (badge: string, type: "coral" | "mint" | "slate" = "slate") => {
    const badgeStyles = {
      coral: "bg-[#FFE8E2] text-[#D9381E]",
      mint: "bg-[#DDF6E8] text-[#00875A]",
      slate: "bg-slate-200/70 text-slate-600",
    };

    return (
      <span
        className={cn(
          "px-2 py-0.5 text-[11px] font-semibold rounded-full min-w-5 text-center leading-tight transition-transform",
          badgeStyles[type]
        )}
      >
        {badge}
      </span>
    );
  };

  return (
    <nav className="flex-1 flex flex-col justify-between py-1 space-y-5">
      <div className="space-y-4">
        {navigationGroups.map((group) => {
          return (
            <div key={group.id} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{group.title}</span>
                </div>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isItemActive(item);
                  const Icon = item.icon;
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isExpanded = !!expandedItems[item.name];

                  return (
                    <div key={item.name} className="relative group">
                      {/* Top-Level Item Link */}
                      <div
                        className={cn(
                          "flex items-center justify-between rounded-xl transition-all relative text-[13.5px]",
                          active && !hasSubItems
                            ? "bg-white text-slate-900 font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]"
                            : active && hasSubItems
                            ? "text-slate-900 font-semibold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium"
                        )}
                      >
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          className={cn(
                            "flex-1 flex items-center gap-3 px-3 py-2.5 min-w-0 rounded-xl",
                            collapsed && "justify-center px-2 py-2.5"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-[18px] h-[18px] shrink-0 transition-colors",
                              active && !hasSubItems
                                ? "text-slate-900"
                                : active && hasSubItems
                                ? "text-slate-900"
                                : "text-slate-500 group-hover:text-slate-800"
                            )}
                          />
                          {!collapsed && (
                            <span className="truncate">{item.name}</span>
                          )}
                        </Link>

                        {/* Right side: Badge and Accordion Toggle */}
                        {!collapsed && (
                          <div className="flex items-center gap-1.5 pr-2.5">
                            {item.badge && !hasSubItems && (
                              renderBadge(item.badge, item.badgeType)
                            )}

                            {hasSubItems && (
                              <button
                                type="button"
                                onClick={(e) => toggleExpand(item.name, e)}
                                title={isExpanded ? "Collapse sub-menu" : "Expand sub-menu"}
                                className="p-1 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Sub-Items Tree: Elegant Branch Connector Line as in Reference Image */}
                      {!collapsed && hasSubItems && isExpanded && (
                        <div className="ml-4 pl-3.5 my-1.5 border-l border-slate-200/90 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                          {item.subItems!.map((sub) => {
                            const subActive = isSubItemActive(sub);

                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={onNavigate}
                                className={cn(
                                  "flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition-all",
                                  subActive
                                    ? "bg-white text-slate-900 font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50 font-normal"
                                )}
                              >
                                <span className="truncate">{sub.name}</span>
                                {sub.badge && renderBadge(sub.badge, sub.badgeType)}
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {/* Tooltip & Popover when collapsed */}
                      {collapsed && (
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 text-white rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap min-w-[140px]">
                          <div className="text-xs font-semibold pb-1 border-b border-slate-800 text-slate-200">
                            {item.name}
                          </div>
                          {hasSubItems && (
                            <div className="pt-1.5 space-y-1">
                              {item.subItems!.map((sub) => (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  onClick={onNavigate}
                                  className="block text-[11px] text-slate-300 hover:text-white hover:bg-slate-800/80 px-1.5 py-1 rounded transition-colors"
                                >
                                  {sub.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export function SidebarNavigation(props: SidebarNavigationProps) {
  return (
    <Suspense fallback={<div className="flex-1 py-2 text-xs text-slate-400">Loading menu...</div>}>
      <SidebarNavigationContent {...props} />
    </Suspense>
  );
}
