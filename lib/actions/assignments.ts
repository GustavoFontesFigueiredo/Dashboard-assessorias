"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/rbac";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  assignmentSchema,
  type AssignmentInput,
} from "@/lib/validators/user";

/**
 * Atribui advogado a cliente (apenas Admin/Controller)
 */
export async function assignLawyer(input: AssignmentInput) {
  try {
    const user = await getSessionUser();
    if (user?.role !== "admin" && user?.role !== "controller") {
      return { error: "Apenas administradores podem atribuir advogados" };
    }

    // Valida input
    const validated = assignmentSchema.parse(input);

    const supabase = await getSupabaseServerClient();

    // Insere atribuição (constraint unique evita duplicatas)
    const { data, error } = await supabase
      .from("lawyer_assignments")
      .insert({
        advogado_id: validated.advogadoId,
        client_id: validated.clientId,
      })
      .select()
      .single();

    if (error) {
      // Já existe
      if (error.code === "23505") {
        return { error: "Este advogado já está atribuído a este cliente" };
      }
      return { error: error.message };
    }

    revalidatePath("/internal/admin/assignments");
    return { success: true, data };
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "Erro ao atribuir advogado" };
  }
}

/**
 * Remove atribuição advogado ↔ cliente
 */
export async function unassignLawyer(
  advogadoId: string,
  clientId: string,
) {
  try {
    const user = await getSessionUser();
    if (user?.role !== "admin" && user?.role !== "controller") {
      return { error: "Apenas administradores podem remover atribuições" };
    }

    const supabase = await getSupabaseServerClient();

    const { error } = await supabase
      .from("lawyer_assignments")
      .delete()
      .eq("advogado_id", advogadoId)
      .eq("client_id", clientId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/internal/admin/assignments");
    return { success: true };
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "Erro ao remover atribuição" };
  }
}

/**
 * Lista todas as atribuições (advogado ↔ cliente)
 */
export async function listAssignments() {
  try {
    const user = await getSessionUser();
    if (user?.role !== "admin" && user?.role !== "controller") {
      return { error: "Acesso negado" };
    }

    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("lawyer_assignments")
      .select(
        "id, advogado_id, client_id, created_at, profiles(nome), clients(razao_social)",
      )
      .order("created_at");

    if (error) {
      return { error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "Erro ao buscar atribuições" };
  }
}

/**
 * Busca atribuições de um advogado específico
 */
export async function getLawyerAssignments(advogadoId: string) {
  try {
    const user = await getSessionUser();
    if (user?.role !== "admin" && user?.role !== "controller") {
      return { error: "Acesso negado" };
    }

    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("lawyer_assignments")
      .select("client_id")
      .eq("advogado_id", advogadoId);

    if (error) {
      return { error: error.message };
    }

    return {
      success: true,
      data: data?.map((a) => a.client_id) || [],
    };
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "Erro ao buscar atribuições" };
  }
}
