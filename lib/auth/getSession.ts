import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface SessionUser {
  id: string;
  email: string;
  role: "admin" | "controller" | "advogado" | "cliente";
  client_id: string | null;
  nome: string;
  ativo: boolean;
}

/**
 * Get current session user
 * Used in Server Components and Server Actions
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await getSupabaseServerClient();

  // Get auth user
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  // Get profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return {
    id: authUser.id,
    email: authUser.email!,
    role: profile.role as SessionUser["role"],
    client_id: profile.client_id,
    nome: profile.nome,
    ativo: profile.ativo,
  };
}
