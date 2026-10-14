import { Router } from "express";
import { z } from "zod";
import { OrganizationController } from "../controllers/organization.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";

const router = Router();

// Validation schema for creating an organization
const createOrgSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    slug: z
      .string()
      .min(2, "Slug must be at least 2 characters")
      .max(50)
      .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  }),
});

// All organization routes require authentication
router.use(requireAuth);

// GET /api/organizations - List organizations user belongs to
router.get("/", OrganizationController.listUserOrganizations);

// POST /api/organizations - Create a new organization
router.post("/", validateRequest(createOrgSchema), OrganizationController.create);

// GET /api/organizations/:id - Get details of an organization
router.get("/:id", OrganizationController.getById);

// GET /api/organizations/:id/members - List members of an organization
router.get("/:id/members", OrganizationController.getMembers);

export const organizationRouter = router;
