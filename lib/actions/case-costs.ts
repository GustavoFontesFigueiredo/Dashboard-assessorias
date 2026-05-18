"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { caseCostSchema } from "@/lib/validators/case";
import type { CaseCostInput } from "@/lib/validators/case";

export async function createCaseCost(input: CaseCostInput) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const validated = caseCostSchema.parse(input);

    const { data, error } = await supabase
      .from("case_costs")
      .insert([{
        case_id: validated.case_id,
        client_id: validated.client_id,
        tipo: validated.tipo,
        descricao: validated.descricao,
        valor: validated.valor,
        data_competencia: validated.data_competencia instanceof Date
          ? validated.data_competencia.toISOString().split("T")[0]
          : validated.data_competencia,
      }])
      .select()
      .single();

    if (error) return { error: error.message };
    return { success: true, data };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "Erro ao criar custo" };
  }
}

export async function updateCaseCost(id: string, input: Partial<CaseCostInput>) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const updateData: Record<string, unknown> = {};
    if (input.tipo) updateData.tipo = input.tipo;
    if (input.descricao) updateData.descricao = input.descricao;
    if (input.valor !== undefined) updateData.valor = input.valor;
    if (input.data_competencia) {
      updateData.data_competencia = input.data_competencia instanceof Date
        ? input.data_competencia.toISOString().split("T")[0]
        : input.data_competencia;
    }

    const { data, error } = await supabase
      .from("case_costs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: error.message };
    return { success: true, data };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "Erro ao atualizar custo" };
  }
}

export async function deleteCaseCost(id: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const { error } = await supabase.from("case_costs").delete().eq("id", id);
    if (error) return { error: error.message };
    return { success: true };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "Erro ao deletar custo" };
  }
}

export async function listCaseCosts(
  clientId: string,
  caseId?: string,
  page: number = 1,
  pageSize: number = 20,
) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado", success: false };

    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("case_costs")
      .select("*", { count: "exact" })
      .eq("client_id", clientId);

    if (caseId) query = query.eq("case_id", caseId);

    const { data, error, count } = await query
      .order("data_competencia", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) return { error: error.message, success: false };

    return {
      success: true,
      data: data || [],
      pagination: {
        page, pageSize,
        total: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      },
    };
  } catch (error) {
    if (error instanceof Error) return { error: error.message, success: false };
    return { error: "Erro ao listar custos", success: false };
  }
}

export async function listAllCaseCosts(page: number = 1, pageSize: number = 20) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado", success: false };

    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from("case_costs")
      .select("*, clients(razao_social)", { count: "exact" })
      .order("data_competencia", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) return { error: error.message, success: false };

    return {
      success: true,
      data: data || [],
      pagination: {
        page, pageSize,
        total: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      },
    };
  } catch (error) {
    if (error instanceof Error) return { error: error.message, success: false };
    return { error: "Erro ao listar custos", success: false };
  }
}
