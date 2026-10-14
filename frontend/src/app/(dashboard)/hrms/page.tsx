import { redirect } from "next/navigation";

interface HRMSPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function HRMSIndexPage({ searchParams }: HRMSPageProps) {
  const { tab } = await searchParams;

  if (tab === "onboarding") {
    redirect("/hrms/onboarding");
  } else if (tab === "departments" || tab === "department") {
    redirect("/hrms/departments");
  } else if (tab === "attendance") {
    redirect("/hrms/attendance");
  } else if (tab === "leaves" || tab === "leave-requests") {
    redirect("/hrms/leave-requests");
  }

  redirect("/hrms/staff");
}
