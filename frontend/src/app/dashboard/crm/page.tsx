import { ContactRound } from "lucide-react";
import { PlaceholderModule } from "@/components/dashboard/placeholder-module";

export default function CRMPage() {
  return (
    <PlaceholderModule
      title="Customer Relationship Management (CRM)"
      description="Track deals, customer pipelines, lead conversions, and sales interactions."
      icon={ContactRound}
    />
  );
}
