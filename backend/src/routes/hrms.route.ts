import { Router } from "express";
import { z } from "zod";
import { HRMSController } from "../controllers/hrms.controller.js";
import { requireAuth, requireOrgContext, requireOrgRole } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { onboardingRouter } from "./onboarding.route.js";

const router = Router();

// Validation Schemas
const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Department name must be at least 2 characters").max(100),
    description: z.string().max(250).optional(),
  }),
});

const createEmployeeSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    email: z.string().email("Invalid email address"),
    phone: z.string().max(20).optional(),
    jobTitle: z.string().min(2, "Job title is required").max(100),
    departmentId: z.string().uuid().optional(),
    employmentType: z.enum(["full_time", "part_time", "contract", "intern"]).default("full_time"),
    salary: z.number().nonnegative().optional(),
    hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD").optional(),
  }),
});

const clockInSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid("Valid employee ID required"),
    notes: z.string().max(200).optional(),
  }),
});

const clockOutSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid("Valid employee ID required"),
  }),
});

const createLeaveSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid("Valid employee ID required"),
    leaveType: z.enum(["annual", "sick", "casual", "maternity", "unpaid"]),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
    reason: z.string().min(5, "Reason must be at least 5 characters").max(500),
  }),
});

const updateLeaveStatusSchema = z.object({
  body: z.object({
    status: z.enum(["approved", "rejected"]),
  }),
});

// All HRMS routes require Authentication AND Organization Context
router.use(requireAuth);
router.use(requireOrgContext);

// --- KPI Stats ---
router.get("/stats", HRMSController.getStats);

// --- Departments ---
router.get("/departments", HRMSController.listDepartments);
router.post(
  "/departments",
  requireOrgRole(["owner", "admin", "manager"]),
  validateRequest(createDepartmentSchema),
  HRMSController.createDepartment
);

// --- Employees ---
router.get("/employees", HRMSController.listEmployees);
router.post(
  "/employees",
  requireOrgRole(["owner", "admin", "manager"]),
  validateRequest(createEmployeeSchema),
  HRMSController.createEmployee
);

// --- Attendance ---
router.get("/attendance", HRMSController.listAttendance);
router.post(
  "/attendance/clock-in",
  validateRequest(clockInSchema),
  HRMSController.clockIn
);
router.post(
  "/attendance/clock-out",
  validateRequest(clockOutSchema),
  HRMSController.clockOut
);

// --- Leave Requests ---
router.get("/leaves", HRMSController.listLeaves);
router.post(
  "/leaves",
  validateRequest(createLeaveSchema),
  HRMSController.createLeave
);
router.patch(
  "/leaves/:id/status",
  requireOrgRole(["owner", "admin", "manager"]),
  validateRequest(updateLeaveStatusSchema),
  HRMSController.updateLeaveStatus
);

// --- Dynamic Branches / Locations ---
router.get("/branches", HRMSController.listBranches);
router.post(
  "/branches",
  requireOrgRole(["owner", "admin", "manager"]),
  HRMSController.createBranch
);
router.put(
  "/branches/:id",
  requireOrgRole(["owner", "admin", "manager"]),
  HRMSController.updateBranch
);
router.delete(
  "/branches/:id",
  requireOrgRole(["owner", "admin", "manager"]),
  HRMSController.deleteBranch
);

// --- Dynamic Positions & Salary Structures ---
router.get("/positions", HRMSController.listPositions);
router.post(
  "/positions",
  requireOrgRole(["owner", "admin", "manager"]),
  HRMSController.createPosition
);
router.put(
  "/positions/:id",
  requireOrgRole(["owner", "admin", "manager"]),
  HRMSController.updatePosition
);
router.delete(
  "/positions/:id",
  requireOrgRole(["owner", "admin", "manager"]),
  HRMSController.deletePosition
);

// --- Probation Durations & Policies ---
router.get("/probation-durations", HRMSController.listProbationDurations);
router.get("/configuration/probation", HRMSController.listProbationDurations);
router.post(
  "/probation-durations",
  requireOrgRole(["owner", "admin", "manager"]),
  HRMSController.createProbationDuration
);
router.post(
  "/configuration/probation",
  requireOrgRole(["owner", "admin", "manager"]),
  HRMSController.createProbationDuration
);
router.put(
  "/probation-durations/:id",
  requireOrgRole(["owner", "admin", "manager"]),
  HRMSController.updateProbationDuration
);
router.put(
  "/configuration/probation/:id",
  requireOrgRole(["owner", "admin", "manager"]),
  HRMSController.updateProbationDuration
);
router.delete(
  "/probation-durations/:id",
  requireOrgRole(["owner", "admin", "manager"]),
  HRMSController.deleteProbationDuration
);
router.delete(
  "/configuration/probation/:id",
  requireOrgRole(["owner", "admin", "manager"]),
  HRMSController.deleteProbationDuration
);

// --- Shifts Configuration ---
router.get("/shifts", HRMSController.listShifts);
router.get("/configuration/shifts", HRMSController.listShifts);
router.post(
  "/shifts",
  requireOrgRole(["owner", "admin", "manager"]),
  HRMSController.createShift
);
router.post(
  "/configuration/shifts",
  requireOrgRole(["owner", "admin", "manager"]),
  HRMSController.createShift
);
router.put(
  "/shifts/:id",
  requireOrgRole(["owner", "admin", "manager"]),
  HRMSController.updateShift
);
router.put(
  "/configuration/shifts/:id",
  requireOrgRole(["owner", "admin", "manager"]),
  HRMSController.updateShift
);
router.delete(
  "/shifts/:id",
  requireOrgRole(["owner", "admin", "manager"]),
  HRMSController.deleteShift
);
router.delete(
  "/configuration/shifts/:id",
  requireOrgRole(["owner", "admin", "manager"]),
  HRMSController.deleteShift
);

// --- Employee Onboarding Pipeline (8-Section Wizard) ---
router.use("/onboarding", onboardingRouter);

export const hrmsRouter = router;
