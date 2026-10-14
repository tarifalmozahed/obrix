import { Router } from "express";
import { z } from "zod";
import { HRMSController } from "../controllers/hrms.controller.js";
import { requireAuth, requireOrgContext, requireOrgRole } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";

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

export const hrmsRouter = router;
