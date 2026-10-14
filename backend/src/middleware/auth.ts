import { Request, Response, NextFunction } from "express";
import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../config/supabase.js";

export type OrgRole = "owner" | "admin" | "manager" | "member";

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export interface OrganizationContext {
  id: string;
  role: OrgRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      token?: string;
      supabase?: SupabaseClient;
      organization?: OrganizationContext;
    }
  }
}

/**
 * 1. Authentication Middleware: Verifies the Supabase JWT.
 * Attaches the user and an RLS-scoped Supabase client to the request.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: { message: "Authorization token required (Bearer <token>)" },
    });
    return;
  }

  const token = authHeader.split(" ")[1];
  const supabase = getSupabaseClient(token);

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: { message: "Invalid or expired token" },
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
    };
    req.token = token;
    req.supabase = supabase;

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * 2. Organization Context Middleware:
 * Enforces organization-level data isolation.
 * Extracts organization ID from header ('x-organization-id') or param (':orgId')
 * and verifies membership via RLS without bypassing security.
 */
export async function requireOrgContext(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const orgId =
    (req.headers["x-organization-id"] as string) || req.params.orgId;

  if (!orgId) {
    res.status(400).json({
      success: false,
      error: {
        message: "Organization ID is required (via 'x-organization-id' header or route parameter)",
      },
    });
    return;
  }

  if (!req.supabase || !req.user) {
    res.status(401).json({
      success: false,
      error: { message: "Authentication required prior to organization verification" },
    });
    return;
  }

  try {
    // Queries organization_members using the user's RLS-scoped client
    const { data: member, error } = await req.supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", req.user.id)
      .single();

    if (error || !member) {
      res.status(403).json({
        success: false,
        error: { message: "You do not have access to this organization" },
      });
      return;
    }

    req.organization = {
      id: orgId,
      role: member.role as OrgRole,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * 3. Role-Based Permissions Middleware (RBAC):
 * Ensures the authenticated user has at least one of the required roles in the organization.
 */
export function requireOrgRole(allowedRoles: OrgRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.organization) {
      res.status(403).json({
        success: false,
        error: { message: "Organization context not established" },
      });
      return;
    }

    if (!allowedRoles.includes(req.organization.role)) {
      res.status(403).json({
        success: false,
        error: {
          message: `Insufficient permissions. Required roles: ${allowedRoles.join(", ")} (Current role: ${req.organization.role})`,
        },
      });
      return;
    }

    next();
  };
}
