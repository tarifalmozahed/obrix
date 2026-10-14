import { Router } from "express";
import {
  listOnboardings,
  getOnboardingById,
  createOnboarding,
  updateOnboarding,
  updateChecklistTask,
  activateOnboardingEmployee,
  deleteOnboarding,
  updateApprovalDecision,
} from "../controllers/onboarding.controller.js";
import { requireAuth, requireOrgContext, requireOrgRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.use(requireOrgContext);

// 1. List all onboardings
router.get("/", listOnboardings);

// 2. Get specific onboarding with docs, tasks, approvals
router.get("/:id", getOnboardingById);

// 3. Create new onboarding draft / record
router.post(
  "/",
  requireOrgRole(["owner", "admin", "manager"]),
  createOnboarding
);

// 4. Update onboarding (Auto-save wizard steps)
router.put(
  "/:id",
  requireOrgRole(["owner", "admin", "manager"]),
  updateOnboarding
);

// 5. Update checklist task status / notes
router.put(
  "/:id/tasks/:taskId",
  updateChecklistTask
);

// 6. Update approval stage decision (Section 6)
router.put(
  "/:id/approvals/:approvalId",
  requireOrgRole(["owner", "admin", "manager"]),
  updateApprovalDecision
);

// 7. Delete onboarding draft / record
router.delete(
  "/:id",
  requireOrgRole(["owner", "admin", "manager"]),
  deleteOnboarding
);

// 8. Final employee activation (Section 8)
router.post(
  "/:id/activate",
  requireOrgRole(["owner", "admin", "manager"]),
  activateOnboardingEmployee
);

export { router as onboardingRouter };
