"use server";

import { createClient } from "@supabase/supabase-js";
import { caseCostSchema } from "@/lib/validators/case";
import { getSessionUser } from "@/lib/auth/getSession";
import { canAccessClient } from "@/lib/auth/rbac";
import type { CaseCostInput } from "@/lib/validators/case";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createCaseCost(input: CaseCostInput) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    if (user.role === "cliente") {
      return { error: "Sem permissão para criar custos" };
    }

    const validated = caseCostSchema.parse(input);

    // Check if user can access this client
    if (!(await canAccessClient(user.id, validated.client_id))) {
      return { error: "Sem permissão para acessar este cliente" };
    }

    const { data, error } = await supabase
      .from("case_costs")
      .insert([
        {
          case_id: validated.case_id,
          client_id: validated.client_id,
          tipo: validated.tipo,
          descricao: validated.descricao,
          valor: validated.valor,
          data_competencia: validated.data_competencia.toISOString().split("T")[0],
        },
      ])
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
    return { error: "Erro ao criar custo" };
  }
}

export async function updateCaseCost(id: string, input: Partial<CaseCostInput>) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    if (user.role === "cliente") {
      return { error: "Sem permissão para editar custos" };
    }

    // Get the cost to check client_id
    const { data: costData } = await supabase
      .from("case_costs")
      .select("client_id")
      .eq("id", id)
      .single();

    if (!costData) {
      return { error: "Custo não encontrado" };
    }

    // Check if user can access this client
    if (!(await canAccessClient(user.id, costData.client_id))) {
      return { error: "Sem permissão para acessar este cliente" };
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (input.tipo) updateData.tipo = input.tipo;
    if (input.descricao) updateData.descricao = input.descricao;
    if (input.valor !== undefined) updateData.valor = input.valor;
    if (input.data_competencia) {
      updateData.data_competencia = input.data_competencia
        .toISOString()
        .split("T")[0];
    }

    const { data, error } = await supabase
      .from("case_costs")
      .update(updateData)
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
    return { error: "Erro ao atualizar custo" };
  }
}

export async function deleteCaseCost(id: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    if (user.role !== "admin" && user.role !== "controller") {
      return { error: "Sem permissão para deletar custos" };
    }

    // Get the cost to check client_id
    const { data: costData } = await supabase
      .from("case_costs")
      .select("client_id")
      .eq("id", id)
      .single();

    if (!costData) {
      return { error: "Custo não encontrado" };
    }

    // Check if user can access this client
    if (!(await canAccessClient(user.id, costData.client_id))) {
      return { error: "Sem permissão para acessar este cliente" };
    }

    const { error } = await supabase
      .from("case_costs")
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
    return { error: "Erro ao deletar custo" };
  }
}

export async function listCaseCosts(
  clientId: string,
  caseId?: string,
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

    let query = supabase
      .from("case_costs")
      .select("*", { count: "exact" })
      .eq("client_id", clientId);

    if (caseId) {
      query = query.eq("case_id", caseId);
    }

    const { data, error, count } = await query
      .order("data_competencia", { ascending: false })
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
    return { error: "Erro ao listar custos", success: false };
  }
}
