import { Calculator } from "lucide-react";
import { PlaceholderModule } from "@/components/dashboard/placeholder-module";

export default function AccountingPage() {
  return (
    <PlaceholderModule
      title="Accounting & Finance"
      description="Monitor corporate ledgers, accounts payable, accounts receivable, and invoices."
      icon={Calculator}
    />
  );
}
