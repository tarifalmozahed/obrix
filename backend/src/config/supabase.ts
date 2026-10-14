import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./environment.js";

/**
 * Creates a Supabase client.
 * When an access token from the request header (Authorization: Bearer <jwt>) is passed,
 * the client operates in the context of the authenticated user, enforcing Row Level Security (RLS).
 *
 * Architecture Rule: NEVER bypass RLS.
 */
export function getSupabaseClient(accessToken?: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  });
}
