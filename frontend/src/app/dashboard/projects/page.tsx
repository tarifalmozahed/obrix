import { FolderKanban } from "lucide-react";
import { PlaceholderModule } from "@/components/dashboard/placeholder-module";

export default function ProjectsPage() {
  return (
    <PlaceholderModule
      title="Project Management"
      description="Plan project milestones, track task completion, assign team members, and view roadmaps."
      icon={FolderKanban}
    />
  );
}
