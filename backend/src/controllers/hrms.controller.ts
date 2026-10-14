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

  // Branches / Locations
  static async listBranches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branches = await HRMSService.listBranches(req.organization!.id, req.supabase!);
      res.status(200).json({ success: true, data: branches });
    } catch (err) {
      next(err);
    }
  }

  static async createBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branch = await HRMSService.createBranch(req.organization!.id, req.body, req.supabase!);
      res.status(201).json({ success: true, data: branch });
    } catch (err) {
      next(err);
    }
  }

  static async updateBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branch = await HRMSService.updateBranch(
        req.organization!.id,
        req.params.id,
        req.body,
        req.supabase!
      );
      res.status(200).json({ success: true, data: branch });
    } catch (err) {
      next(err);
    }
  }

  static async deleteBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await HRMSService.deleteBranch(
        req.organization!.id,
        req.params.id,
        req.supabase!
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // Positions & Position-wise Salary Structures
  static async listPositions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const positions = await HRMSService.listPositions(req.organization!.id, req.supabase!);
      res.status(200).json({ success: true, data: positions });
    } catch (err) {
      next(err);
    }
  }

  static async createPosition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const position = await HRMSService.createPosition(req.organization!.id, req.body, req.supabase!);
      res.status(201).json({ success: true, data: position });
    } catch (err) {
      next(err);
    }
  }

  static async updatePosition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const position = await HRMSService.updatePosition(
        req.organization!.id,
        req.params.id,
        req.body,
        req.supabase!
      );
      res.status(200).json({ success: true, data: position });
    } catch (err) {
      next(err);
    }
  }

  static async deletePosition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await HRMSService.deletePosition(
        req.organization!.id,
        req.params.id,
        req.supabase!
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // PROBATION DURATIONS
  // ==========================================
  static async listProbationDurations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await HRMSService.listProbationDurations(req.organization!.id, req.supabase!);
      res.status(200).json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  }

  static async createProbationDuration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await HRMSService.createProbationDuration(req.organization!.id, req.body, req.supabase!);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  static async updateProbationDuration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await HRMSService.updateProbationDuration(
        req.organization!.id,
        req.params.id,
        req.body,
        req.supabase!
      );
      res.status(200).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  static async deleteProbationDuration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await HRMSService.deleteProbationDuration(
        req.organization!.id,
        req.params.id,
        req.supabase!
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // SHIFTS
  // ==========================================
  static async listShifts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await HRMSService.listShifts(req.organization!.id, req.supabase!);
      res.status(200).json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  }

  static async createShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await HRMSService.createShift(req.organization!.id, req.body, req.supabase!);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  static async updateShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await HRMSService.updateShift(
        req.organization!.id,
        req.params.id,
        req.body,
        req.supabase!
      );
      res.status(200).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  static async deleteShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await HRMSService.deleteShift(
        req.organization!.id,
        req.params.id,
        req.supabase!
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
