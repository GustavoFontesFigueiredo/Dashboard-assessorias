"use server";

import { createClient } from "@supabase/supabase-js";
import { caseReceiptSchema } from "@/lib/validators/case";
import { getSessionUser } from "@/lib/auth/getSession";
import { canAccessClient } from "@/lib/auth/rbac";
import type { CaseReceiptInput } from "@/lib/validators/case";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createCaseReceipt(input: CaseReceiptInput) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    if (user.role === "cliente") {
      return { error: "Sem permissão para criar recebimentos" };
    }

    const validated = caseReceiptSchema.parse(input);

    // Check if user can access this client
    if (!(await canAccessClient(user.id, validated.client_id))) {
      return { error: "Sem permissão para acessar este cliente" };
    }

    const { data, error } = await supabase
      .from("case_receipts")
      .insert([
        {
          case_id: validated.case_id,
          client_id: validated.client_id,
          descricao: validated.descricao,
          valor: validated.valor,
          data: validated.data.toISOString().split("T")[0],
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
    return { error: "Erro ao criar recebimento" };
  }
}

export async function updateCaseReceipt(
  id: string,
  input: Partial<CaseReceiptInput>
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    if (user.role === "cliente") {
      return { error: "Sem permissão para editar recebimentos" };
    }

    // Get the receipt to check client_id
    const { data: receiptData } = await supabase
      .from("case_receipts")
      .select("client_id")
      .eq("id", id)
      .single();

    if (!receiptData) {
      return { error: "Recebimento não encontrado" };
    }

    // Check if user can access this client
    if (!(await canAccessClient(user.id, receiptData.client_id))) {
      return { error: "Sem permissão para acessar este cliente" };
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (input.descricao) updateData.descricao = input.descricao;
    if (input.valor !== undefined) updateData.valor = input.valor;
    if (input.data) {
      updateData.data = input.data.toISOString().split("T")[0];
    }

    const { data, error } = await supabase
      .from("case_receipts")
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
    return { error: "Erro ao atualizar recebimento" };
  }
}

export async function deleteCaseReceipt(id: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    if (user.role !== "admin" && user.role !== "controller") {
      return { error: "Sem permissão para deletar recebimentos" };
    }

    // Get the receipt to check client_id
    const { data: receiptData } = await supabase
      .from("case_receipts")
      .select("client_id")
      .eq("id", id)
      .single();

    if (!receiptData) {
      return { error: "Recebimento não encontrado" };
    }

    // Check if user can access this client
    if (!(await canAccessClient(user.id, receiptData.client_id))) {
      return { error: "Sem permissão para acessar este cliente" };
    }

    const { error } = await supabase
      .from("case_receipts")
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
    return { error: "Erro ao deletar recebimento" };
  }
}

export async function listCaseReceipts(
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
      .from("case_receipts")
      .select("*", { count: "exact" })
      .eq("client_id", clientId);

    if (caseId) {
      query = query.eq("case_id", caseId);
    }

    const { data, error, count } = await query
      .order("data", { ascending: false })
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
    return { error: "Erro ao listar recebimentos", success: false };
  }
}
