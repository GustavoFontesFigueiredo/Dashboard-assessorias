"use server";

import { createClient } from "@supabase/supabase-js";
import { caseCreateSchema, caseUpdateSchema } from "@/lib/validators/case";
import { getSessionUser } from "@/lib/auth/getSession";
import { canAccessClient } from "@/lib/auth/rbac";
import type { CaseCreateInput, CaseUpdateInput } from "@/lib/validators/case";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createCase(input: CaseCreateInput) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    if (user.role === "cliente") {
      return { error: "Sem permissão para criar processos" };
    }

    const validated = caseCreateSchema.parse(input);

    // Check if user can access this client
    if (!(await canAccessClient(user.id, validated.client_id))) {
      return { error: "Sem permissão para acessar este cliente" };
    }

    const { data, error } = await supabase
      .from("cases")
      .insert([
        {
          client_id: validated.client_id,
          numero_processo: validated.numero_processo,
          descricao: validated.descricao,
          fase: validated.fase,
          status: validated.status,
          valor_pleiteado_contra: validated.valor_pleiteado_contra,
          valor_condenado_contra: validated.valor_condenado_contra,
          valor_condenacao_favoravel: validated.valor_condenacao_favoravel,
          valor_acordo_recebido: validated.valor_acordo_recebido,
          advogado_responsavel_id: validated.advogado_responsavel_id,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { error: "Este número de processo já existe" };
      }
      return { error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Erro ao criar processo" };
  }
}

export async function updateCase(id: string, input: CaseUpdateInput) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    if (user.role === "cliente") {
      return { error: "Sem permissão para editar processos" };
    }

    const validated = caseUpdateSchema.parse(input);

    // Get the case to check client_id
    const { data: caseData } = await supabase
      .from("cases")
      .select("client_id")
      .eq("id", id)
      .single();

    if (!caseData) {
      return { error: "Processo não encontrado" };
    }

    // Check if user can access this client
    if (!(await canAccessClient(user.id, caseData.client_id))) {
      return { error: "Sem permissão para acessar este cliente" };
    }

    const { data, error } = await supabase
      .from("cases")
      .update(validated)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Erro ao atualizar processo" };
  }
}

export async function deleteCase(id: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    if (user.role !== "admin" && user.role !== "controller") {
      return { error: "Sem permissão para deletar processos" };
    }

    // Get the case to check client_id
    const { data: caseData } = await supabase
      .from("cases")
      .select("client_id")
      .eq("id", id)
      .single();

    if (!caseData) {
      return { error: "Processo não encontrado" };
    }

    // Check if user can access this client
    if (!(await canAccessClient(user.id, caseData.client_id))) {
      return { error: "Sem permissão para acessar este cliente" };
    }

    const { error } = await supabase
      .from("cases")
      .delete()
      .eq("id", id);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Erro ao deletar processo" };
  }
}

export async function listCases(
  clientId: string,
  page: number = 1,
  pageSize: number = 20
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { error: "Não autenticado", success: false };
    }

    // Check if user can access this client
    if (!(await canAccessClient(user.id, clientId))) {
      return { error: "Sem permissão para acessar este cliente", success: false };
    }

    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from("cases")
      .select("*", { count: "exact" })
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      return { error: error.message, success: false };
    }

    const totalPages = count ? Math.ceil(count / pageSize) : 0;

    return {
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message, success: false };
    }
    return { error: "Erro ao listar processos", success: false };
  }
}

export async function getCaseById(id: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { error: "Não autenticado", data: null };
    }

    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return { error: "Processo não encontrado", data: null };
    }

    // Check if user can access this client
    if (!(await canAccessClient(user.id, data.client_id))) {
      return { error: "Sem permissão para acessar este cliente", data: null };
    }

    return { success: true, data };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message, data: null };
    }
    return { error: "Erro ao buscar processo", data: null };
  }
}
