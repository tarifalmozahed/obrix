import { apiRequest } from "./api";
import { Branch, Position, Employee, Department, ProbationDuration, Shift } from "@/types/hrms";

// --- Branches / Locations ---
export async function fetchBranches(orgId: string) {
  return apiRequest<Branch[]>("/hrms/branches", {}, orgId);
}

export async function createBranch(orgId: string, data: Partial<Branch>) {
  return apiRequest<Branch>(
    "/hrms/branches",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    orgId
  );
}

// --- Positions & Salary Structures ---
export async function fetchPositions(orgId: string) {
  return apiRequest<Position[]>("/hrms/positions", {}, orgId);
}

export async function createPosition(orgId: string, data: Partial<Position>) {
  return apiRequest<Position>(
    "/hrms/positions",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    orgId
  );
}

export async function updatePosition(orgId: string, id: string, data: Partial<Position>) {
  return apiRequest<Position>(
    `/hrms/positions/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
    orgId
  );
}

export async function deletePosition(orgId: string, id: string) {
  return apiRequest<{ message: string }>(
    `/hrms/positions/${id}`,
    {
      method: "DELETE",
    },
    orgId
  );
}

// --- Probation Durations & Policies ---
export async function fetchProbationDurations(orgId: string) {
  return apiRequest<ProbationDuration[]>("/hrms/probation-durations", {}, orgId);
}

export async function createProbationDuration(orgId: string, data: Partial<ProbationDuration>) {
  return apiRequest<ProbationDuration>(
    "/hrms/probation-durations",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    orgId
  );
}

export async function updateProbationDuration(orgId: string, id: string, data: Partial<ProbationDuration>) {
  return apiRequest<ProbationDuration>(
    `/hrms/probation-durations/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
    orgId
  );
}

export async function deleteProbationDuration(orgId: string, id: string) {
  return apiRequest<{ message: string }>(
    `/hrms/probation-durations/${id}`,
    {
      method: "DELETE",
    },
    orgId
  );
}

// --- Shifts Configuration ---
export async function fetchShifts(orgId: string) {
  return apiRequest<Shift[]>("/hrms/shifts", {}, orgId);
}

export async function createShift(orgId: string, data: Partial<Shift>) {
  return apiRequest<Shift>(
    "/hrms/shifts",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    orgId
  );
}

export async function updateShift(orgId: string, id: string, data: Partial<Shift>) {
  return apiRequest<Shift>(
    `/hrms/shifts/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
    orgId
  );
}

export async function deleteShift(orgId: string, id: string) {
  return apiRequest<{ message: string }>(
    `/hrms/shifts/${id}`,
    {
      method: "DELETE",
    },
    orgId
  );
}

// --- Employees ---
export async function fetchEmployees(orgId: string) {
  return apiRequest<Employee[]>("/hrms/employees", {}, orgId);
}

export async function createEmployee(orgId: string, data: Partial<Employee>) {
  return apiRequest<Employee>(
    "/hrms/employees",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    orgId
  );
}

// --- Departments ---
export async function fetchDepartments(orgId: string) {
  return apiRequest<Department[]>("/hrms/departments", {}, orgId);
}

export async function createDepartment(
  orgId: string,
  data: { name: string; description?: string }
) {
  return apiRequest<Department>(
    "/hrms/departments",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    orgId
  );
}
