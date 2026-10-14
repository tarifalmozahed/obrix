import { Request, Response } from "express";
import { HealthService } from "../services/health.service.js";

export class HealthController {
  static getHealth(_req: Request, res: Response): void {
    const status = HealthService.getStatus();
    res.status(200).json({
      success: true,
      data: status,
    });
  }
}
