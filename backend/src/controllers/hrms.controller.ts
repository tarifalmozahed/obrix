import { Request, Response, NextFunction } from "express";
import { HRMSService } from "../services/hrms.service.js";

export class HRMSController {
  // Stats
  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await HRMSService.getStats(req.organization!.id, req.supabase!);
      res.status(200).json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  // Departments
  static async listDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const depts = await HRMSService.listDepartments(req.organization!.id, req.supabase!);
      res.status(200).json({ success: true, data: depts });
    } catch (err) {
      next(err);
    }
  }

  static async createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dept = await HRMSService.createDepartment(req.organization!.id, req.body, req.supabase!);
      res.status(201).json({ success: true, data: dept });
    } catch (err) {
      next(err);
    }
  }

  // Employees
  static async listEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employees = await HRMSService.listEmployees(req.organization!.id, req.supabase!);
      res.status(200).json({ success: true, data: employees });
    } catch (err) {
      next(err);
    }
  }

  static async createEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await HRMSService.createEmployee(req.organization!.id, req.body, req.supabase!);
      res.status(201).json({ success: true, data: employee });
    } catch (err) {
      next(err);
    }
  }

  // Attendance
  static async listAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetDate = (req.query.date as string) || new Date().toISOString().split("T")[0];
      const records = await HRMSService.listAttendance(req.organization!.id, targetDate, req.supabase!);
      res.status(200).json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  }

  static async clockIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await HRMSService.clockIn(
        req.organization!.id,
        req.body.employeeId,
        req.body.notes,
        req.supabase!
      );
      res.status(201).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }

  static async clockOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await HRMSService.clockOut(
        req.organization!.id,
        req.body.employeeId,
        req.supabase!
      );
      res.status(200).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }

  // Leaves
  static async listLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const leaves = await HRMSService.listLeaveRequests(req.organization!.id, req.supabase!);
      res.status(200).json({ success: true, data: leaves });
    } catch (err) {
      next(err);
    }
  }

  static async createLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const leave = await HRMSService.createLeaveRequest(req.organization!.id, req.body, req.supabase!);
      res.status(201).json({ success: true, data: leave });
    } catch (err) {
      next(err);
    }
  }

  static async updateLeaveStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await HRMSService.updateLeaveStatus(
        req.organization!.id,
        req.params.id,
        req.body.status,
        req.user!.id,
        req.supabase!
      );
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
}
