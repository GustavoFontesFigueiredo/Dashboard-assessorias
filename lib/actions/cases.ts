"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { caseCreateSchema, caseUpdateSchema } from "@/lib/validators/case";
import type { CaseCreateInput, CaseUpdateInput } from "@/lib/validators/case";

export async function createCase(input: CaseCreateInput) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const validated = caseCreateSchema.parse(input);

    const { data, error } = await supabase
      .from("cases")
      .insert([{
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
      }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return { error: "Este número de processo já existe" };
      return { error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "Erro ao criar processo" };
  }
}

export async function updateCase(id: string, input: CaseUpdateInput) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const validated = caseUpdateSchema.parse(input);

    const { data, error } = await supabase
      .from("cases")
      .update(validated)
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: error.message };
    return { success: true, data };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "Erro ao atualizar processo" };
  }
}

export async function deleteCase(id: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const { error } = await supabase.from("cases").delete().eq("id", id);
    if (error) return { error: error.message };
    return { success: true };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "Erro ao deletar processo" };
  }
}

export async function listCases(
  clientId: string,
  page: number = 1,
  pageSize: number = 20,
) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado", success: false };

    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from("cases")
      .select("*", { count: "exact" })
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) return { error: error.message, success: false };

    return {
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      },
    };
  } catch (error) {
    if (error instanceof Error) return { error: error.message, success: false };
    return { error: "Erro ao listar processos", success: false };
  }
}

export async function getCaseById(id: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado", data: null };

    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return { error: "Processo não encontrado", data: null };
    return { success: true, data };
  } catch (error) {
    if (error instanceof Error) return { error: error.message, data: null };
    return { error: "Erro ao buscar processo", data: null };
  }
}

export async function listAllCases(page: number = 1, pageSize: number = 20) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado", success: false };

    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from("cases")
      .select("*, clients(razao_social)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) return { error: error.message, success: false };

    return {
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      },
    };
  } catch (error) {
    if (error instanceof Error) return { error: error.message, success: false };
    return { error: "Erro ao listar processos", success: false };
  }
}
