import { Router } from "express";
import { healthRouter } from "./health.route.js";
import { organizationRouter } from "./organization.route.js";
import { hrmsRouter } from "./hrms.route.js";
import { mediaRouter } from "./media.route.js";

const apiRouter = Router();

// Health Check Endpoint
apiRouter.use("/health", healthRouter);

// Organizations & Multi-Tenant Management
apiRouter.use("/organizations", organizationRouter);

// HRMS Business Module
apiRouter.use("/hrms", hrmsRouter);

// Cloudinary Media Management Module
apiRouter.use("/media", mediaRouter);

export { apiRouter };
