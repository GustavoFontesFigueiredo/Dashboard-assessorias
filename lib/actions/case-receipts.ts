"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { caseReceiptSchema } from "@/lib/validators/case";
import type { CaseReceiptInput } from "@/lib/validators/case";

export async function createCaseReceipt(input: CaseReceiptInput) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const validated = caseReceiptSchema.parse(input);

    const { data, error } = await supabase
      .from("case_receipts")
      .insert([{
        case_id: validated.case_id,
        client_id: validated.client_id,
        descricao: validated.descricao,
        valor: validated.valor,
        data: validated.data instanceof Date
          ? validated.data.toISOString().split("T")[0]
          : validated.data,
      }])
      .select()
      .single();

    if (error) return { error: error.message };
    return { success: true, data };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "Erro ao criar recebimento" };
  }
}

export async function updateCaseReceipt(id: string, input: Partial<CaseReceiptInput>) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const updateData: Record<string, unknown> = {};
    if (input.descricao) updateData.descricao = input.descricao;
    if (input.valor !== undefined) updateData.valor = input.valor;
    if (input.data) {
      updateData.data = input.data instanceof Date
        ? input.data.toISOString().split("T")[0]
        : input.data;
    }

    const { data, error } = await supabase
      .from("case_receipts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: error.message };
    return { success: true, data };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "Erro ao atualizar recebimento" };
  }
}

export async function deleteCaseReceipt(id: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const { error } = await supabase.from("case_receipts").delete().eq("id", id);
    if (error) return { error: error.message };
    return { success: true };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "Erro ao deletar recebimento" };
  }
}

export async function listCaseReceipts(
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
      .from("case_receipts")
      .select("*", { count: "exact" })
      .eq("client_id", clientId);

    if (caseId) query = query.eq("case_id", caseId);

    const { data, error, count } = await query
      .order("data", { ascending: false })
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
    return { error: "Erro ao listar recebimentos", success: false };
  }
}

export async function listAllCaseReceipts(page: number = 1, pageSize: number = 20) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado", success: false };

    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from("case_receipts")
      .select("*, clients(razao_social)", { count: "exact" })
      .order("data", { ascending: false })
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
    return { error: "Erro ao listar recebimentos", success: false };
  }
}
