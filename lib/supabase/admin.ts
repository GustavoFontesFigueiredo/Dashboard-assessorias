import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com service_role — IGNORA RLS.
 * Uso restrito a rotas administrativas server-side (convite de usuários,
 * migrações, jobs). Nunca importar em código que possa rodar no client.
 */
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL ausente.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
