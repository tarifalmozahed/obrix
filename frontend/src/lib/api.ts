import { createClient } from "./supabase";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Helper to make authenticated REST API calls from Next.js to the Express backend.
 * Automatically injects the user's Supabase JWT access token and active organization ID.
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  organizationId?: string
): Promise<{ success: boolean; data?: T; error?: { message: string; details?: unknown } }> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  if (organizationId) {
    headers["x-organization-id"] = organizationId;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response.json();
}
