import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com service role — bypassa RLS.
 * Use APENAS em Server Actions/Route Handlers para operações administrativas.
 */
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Variáveis de ambiente do Supabase Admin não configuradas");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
