import { Router } from "express";
import { healthRouter } from "./health.route.js";
import { organizationRouter } from "./organization.route.js";
import { hrmsRouter } from "./hrms.route.js";

const apiRouter = Router();

// Health Check Endpoint
apiRouter.use("/health", healthRouter);

// Organizations & Multi-Tenant Management
apiRouter.use("/organizations", organizationRouter);

// HRMS Business Module
apiRouter.use("/hrms", hrmsRouter);

// apiRouter.use("/crm", crmRouter);
// apiRouter.use("/projects", projectsRouter);
// apiRouter.use("/accounting", accountingRouter);

export { apiRouter };
