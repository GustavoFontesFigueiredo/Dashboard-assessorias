import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type Role = "admin" | "controller" | "advogado" | "cliente";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  clientId?: string;
  nome?: string;
}

/**
 * Obtém a sessão do usuário atual via Supabase Auth.
 * Retorna null se não autenticado.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return null;

  // Busca o perfil do usuário na tabela profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id, nome")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email || "",
    role: profile.role as Role,
    clientId: profile.client_id || undefined,
    nome: profile.nome || undefined,
  };
}

/**
 * Verifica se um usuário tem um papel específico.
 */
export async function hasRole(userId: string, role: Role): Promise<boolean> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return data?.role === role;
}

/**
 * Verifica se um usuário consegue acessar um cliente específico.
 * Admin/Controller conseguem acessar qualquer um.
 * Advogado precisa ter atribuição.
 * Cliente só consegue acessar seu próprio cliente.
 */
export async function canAccessClient(
  userId: string,
  clientId: string,
): Promise<boolean> {
  const user = await getSessionUser();
  if (!user || user.id !== userId) return false;

  // Admin e controller conseguem acessar qualquer cliente
  if (user.role === "admin" || user.role === "controller") {
    return true;
  }

  // Cliente consegue acessar só seu próprio cliente
  if (user.role === "cliente") {
    return user.clientId === clientId;
  }

  // Advogado: verifica se tem atribuição
  if (user.role === "advogado") {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase
      .from("lawyer_assignments")
      .select("id")
      .eq("advogado_id", userId)
      .eq("client_id", clientId)
      .single();

    return !!data;
  }

  return false;
}

/**
 * Verifica se um usuário consegue editar um processo específico.
 * Usa canAccessClient como base (se não consegue acessar o cliente, não consegue editar).
 */
export async function canEditCase(
  userId: string,
  caseId: string,
): Promise<boolean> {
  const user = await getSessionUser();
  if (!user || user.id !== userId) return false;

  // Admin/Controller conseguem editar qualquer caso
  if (user.role === "admin" || user.role === "controller") {
    return true;
  }

  // Cliente e Advogado: só conseguem editar se conseguem acessar o cliente do caso
  const supabase = await getSupabaseServerClient();
  const { data: caseData } = await supabase
    .from("cases")
    .select("client_id")
    .eq("id", caseId)
    .single();

  if (!caseData) return false;

  return canAccessClient(userId, caseData.client_id);
}

/**
 * Obtém a lista de clientes que um usuário consegue acessar.
 */
export async function getAccessibleClients(userId: string): Promise<string[]> {
  const user = await getSessionUser();
  if (!user || user.id !== userId) return [];

  const supabase = await getSupabaseServerClient();

  // Admin/Controller conseguem ver todos os clientes
  if (user.role === "admin" || user.role === "controller") {
    const { data } = await supabase
      .from("clients")
      .select("id")
      .eq("ativo", true);
    return data?.map((c) => c.id) || [];
  }

  // Cliente consegue ver só seu próprio cliente
  if (user.role === "cliente" && user.clientId) {
    return [user.clientId];
  }

  // Advogado consegue ver clientes aos quais tem atribuição
  if (user.role === "advogado") {
    const { data } = await supabase
      .from("lawyer_assignments")
      .select("client_id")
      .eq("advogado_id", userId);
    return data?.map((a) => a.client_id) || [];
  }

  return [];
}
