import { CircleUserRound } from "lucide-react";
import { PlaceholderModule } from "@/components/dashboard/placeholder-module";

export default function ProfilePage() {
  return (
    <PlaceholderModule
      title="User Profile"
      description="View and update personal details, security credentials, and communication preferences."
      icon={CircleUserRound}
    />
  );
}
