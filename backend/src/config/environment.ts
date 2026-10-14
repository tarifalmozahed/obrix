import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5000").transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  SUPABASE_URL: z.string().url().default("https://ufkozzlxzfhleiqklyjb.supabase.co"),
  SUPABASE_ANON_KEY: z.string().min(1).default("sb_publishable_286vN52b1ksNmlbKxVJbuw_Yqc5e7S7"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
