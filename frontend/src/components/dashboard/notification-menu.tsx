"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";

const initialNotifications = [
  {
    id: "1",
    title: "New Employee Onboarded",
    description: "Sarah Jenkins was added to the Engineering department.",
    time: "10m ago",
    unread: true,
  },
  {
    id: "2",
    title: "Invoice #1042 Paid",
    description: "$12,450 received from GlobalTech Industries.",
    time: "45m ago",
    unread: true,
  },
  {
    id: "3",
    title: "Milestone Completed",
    description: "Sprint 42 deliverables were completed ahead of deadline.",
    time: "2h ago",
    unread: false,
  },
];

export function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="View notifications"
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100">
            <div className="font-semibold text-xs text-slate-900">Notifications</div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Mark read</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`p-2.5 rounded-lg text-xs hover:bg-slate-50 transition-colors ${
                  item.unread ? "bg-indigo-50/30" : ""
                }`}
              >
                <div className="flex justify-between items-start gap-1">
                  <span className="font-semibold text-slate-900">{item.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{item.time}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
