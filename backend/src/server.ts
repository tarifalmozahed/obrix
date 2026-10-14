import app from "./app.js";
import { env } from "./config/environment.js";

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log("==================================================");
  console.log(`🚀 Orbix Backend running at: http://localhost:${PORT}`);
  console.log(`🩺 Health check endpoint:   http://localhost:${PORT}/api/health`);
  console.log(`🌐 Allowed CORS Origin:     ${env.CORS_ORIGIN}`);
  console.log(`⚙️  Environment:             ${env.NODE_ENV}`);
  console.log("==================================================");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated.");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated.");
  });
});
