import { Request, Response, NextFunction } from "express";
import { OrganizationService } from "../services/organization.service.js";

export class OrganizationController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await OrganizationService.createOrganization(
        req.body,
        req.user!.id,
        req.supabase!,
        req.user?.email
      );

      res.status(201).json({
        success: true,
        data: org,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listUserOrganizations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const orgs = await OrganizationService.listUserOrganizations(
        req.user!.id,
        req.supabase!
      );

      res.status(200).json({
        success: true,
        data: orgs,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await OrganizationService.getById(
        req.params.id,
        req.supabase!
      );

      res.status(200).json({
        success: true,
        data: org,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const members = await OrganizationService.getMembers(
        req.params.id,
        req.supabase!
      );

      res.status(200).json({
        success: true,
        data: members,
      });
    } catch (error) {
      next(error);
    }
  }
}
