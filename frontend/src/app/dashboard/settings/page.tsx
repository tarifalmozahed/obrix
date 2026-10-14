import { Settings } from "lucide-react";
import { PlaceholderModule } from "@/components/dashboard/placeholder-module";

export default function SettingsPage() {
  return (
    <PlaceholderModule
      title="System Settings"
      description="Configure workspace preferences, roles & permissions, integrations, and security settings."
      icon={Settings}
    />
  );
}
