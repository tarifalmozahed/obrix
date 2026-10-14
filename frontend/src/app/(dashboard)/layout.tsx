import { Metadata } from "next";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export const metadata: Metadata = {
  title: "Orbix - Enterprise Dashboard",
  description: "Enterprise multi-module business management system dashboard.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
