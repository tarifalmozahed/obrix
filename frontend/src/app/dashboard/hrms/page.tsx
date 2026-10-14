import { Users } from "lucide-react";
import { PlaceholderModule } from "@/components/dashboard/placeholder-module";

export default function HRMSPage() {
  return (
    <PlaceholderModule
      title="Human Resource Management (HRMS)"
      description="Manage employees, organizational structures, attendance, and leave management."
      icon={Users}
    />
  );
}
