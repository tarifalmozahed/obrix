"use client";

import { Users, ContactRound, FolderKanban, Calculator } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { TasksTable } from "@/components/dashboard/tasks-table";
import { OrganizationInfoCard } from "@/components/dashboard/organization-info-card";
import { useDashboard } from "@/context/dashboard-context";

export default function DashboardOverviewPage() {
  const { user, activeOrg } = useDashboard();
  const greeting = user?.firstName ? `Good morning, ${user.firstName}` : "Welcome back";
  const subtitle = activeOrg
    ? `Here's what's happening across ${activeOrg.name} today.`
    : "Here's what's happening across your organization today.";

  return (
    <div className="space-y-6">
      {/* Page Header with Live Auth Data */}
      <PageHeader
        title={greeting}
        subtitle={subtitle}
        showCreateButton={true}
      />

      {/* Organization Information Card */}
      <OrganizationInfoCard />

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value="248"
          icon={Users}
          change={{ value: "+12%", isPositive: true }}
          supportingLabel="vs. last quarter"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Active Deals"
          value="36"
          icon={ContactRound}
          change={{ value: "+8%", isPositive: true }}
          supportingLabel="vs. last month"
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatCard
          title="Active Projects"
          value="18"
          icon={FolderKanban}
          change={{ value: "-2", isPositive: false }}
          supportingLabel="vs. last month"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Monthly Revenue"
          value="$86,420"
          icon={Calculator}
          change={{ value: "+14.6%", isPositive: true }}
          supportingLabel="vs. last month"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Middle Grid: Performance Chart & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8">
          <PerformanceChart />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <RecentActivity />
        </div>
      </div>

      {/* Bottom Section: My Tasks Table */}
      <div>
        <TasksTable />
      </div>
    </div>
  );
}
