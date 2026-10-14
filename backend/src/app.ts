import express, { Application, Request, Response } from "express";
import cors from "cors";
import { env } from "./config/environment.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app: Application = express();

// Middlewares
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (env.NODE_ENV === "development") {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// API Routes
app.use("/api", apiRouter);

// Root greeting / basic ping
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Orbix Business Management System API",
    healthCheck: "/api/health",
    version: "0.1.0",
  });
});

// 404 handler for undefined routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
});

// Global error handler
app.use(errorHandler);

export default app;
