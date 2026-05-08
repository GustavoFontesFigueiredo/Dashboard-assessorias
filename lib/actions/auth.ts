"use server";

import { getSessionUser } from "@/lib/auth/getSession";

/**
 * Get current user's client ID
 * Safe to call from client components via server action
 */
export async function getCurrentUserClientId(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.client_id || null;
}

/**
 * Get current user session
 * Safe to call from client components via server action
 */
export async function getCurrentUser() {
  return await getSessionUser();
}
