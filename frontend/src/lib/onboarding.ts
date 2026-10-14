import { apiRequest } from "./api";
import { EmployeeOnboarding, OnboardingTask } from "@/types/onboarding";

export async function fetchOnboardings(orgId: string, status?: string) {
  const url = status && status !== "all" ? `/hrms/onboarding?status=${status}` : "/hrms/onboarding";
  return apiRequest<EmployeeOnboarding[]>(url, {}, orgId);
}

export async function fetchOnboardingById(id: string, orgId: string) {
  return apiRequest<EmployeeOnboarding>(`/hrms/onboarding/${id}`, {}, orgId);
}

export async function createOnboardingRecord(
  data: Partial<EmployeeOnboarding>,
  orgId: string
) {
  return apiRequest<EmployeeOnboarding>(
    "/hrms/onboarding",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    orgId
  );
}

export async function updateOnboardingRecord(
  id: string,
  data: Partial<EmployeeOnboarding>,
  orgId: string
) {
  return apiRequest<EmployeeOnboarding>(
    `/hrms/onboarding/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
    orgId
  );
}

export async function updateOnboardingTask(
  onboardingId: string,
  taskId: string,
  data: Partial<OnboardingTask>,
  orgId: string
) {
  return apiRequest<OnboardingTask>(
    `/hrms/onboarding/${onboardingId}/tasks/${taskId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
    orgId
  );
}

export async function updateOnboardingApproval(
  onboardingId: string,
  approvalId: string,
  data: { status: string; comments?: string; rejectionReason?: string },
  orgId: string
) {
  return apiRequest(
    `/hrms/onboarding/${onboardingId}/approvals/${approvalId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
    orgId
  );
}

export async function deleteOnboardingRecord(id: string, orgId: string) {
  return apiRequest<{ message: string }>(
    `/hrms/onboarding/${id}`,
    {
      method: "DELETE",
    },
    orgId
  );
}

export async function activateOnboardingEmployee(onboardingId: string, orgId: string) {
  return apiRequest<{ message: string; employee: unknown; onboardingId: string }>(
    `/hrms/onboarding/${onboardingId}/activate`,
    {
      method: "POST",
    },
    orgId
  );
}
