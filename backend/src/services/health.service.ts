import os from "os";
import { env } from "../config/environment.js";

export interface HealthStatus {
  status: "ok" | "degraded";
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  uptime: number; // in seconds
  system: {
    platform: string;
    memoryFreeMB: number;
    memoryTotalMB: number;
  };
  supabase: {
    configured: boolean;
    url: string;
  };
}

export class HealthService {
  static getStatus(): HealthStatus {
    const freeMem = Math.round(os.freemem() / 1024 / 1024);
    const totalMem = Math.round(os.totalmem() / 1024 / 1024);

    return {
      status: "ok",
      service: "orbix-backend",
      version: "0.1.0",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      system: {
        platform: os.platform(),
        memoryFreeMB: freeMem,
        memoryTotalMB: totalMem,
      },
      supabase: {
        configured: Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY),
        url: env.SUPABASE_URL,
      },
    };
  }
}
