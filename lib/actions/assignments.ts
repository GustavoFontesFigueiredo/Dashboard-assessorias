"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { assignmentSchema, type AssignmentInput } from "@/lib/validators/user";

export async function assignLawyer(input: AssignmentInput) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const validated = assignmentSchema.parse(input);

    const { data, error } = await supabase
      .from("lawyer_assignments")
      .insert({ advogado_id: validated.advogadoId, client_id: validated.clientId })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return { error: "Este advogado já está atribuído a este cliente" };
      return { error: error.message };
    }

    revalidatePath("/admin/assignments");
    return { success: true, data };
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    return { error: "Erro ao atribuir advogado" };
  }
}

export async function unassignLawyer(advogadoId: string, clientId: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const { error } = await supabase
      .from("lawyer_assignments")
      .delete()
      .eq("advogado_id", advogadoId)
      .eq("client_id", clientId);

    if (error) return { error: error.message };

    revalidatePath("/admin/assignments");
    return { success: true };
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    return { error: "Erro ao remover atribuição" };
  }
}

export async function listAssignments() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Acesso negado" };

    const { data, error } = await supabase
      .from("lawyer_assignments")
      .select("id, advogado_id, client_id, created_at, profiles(nome), clients(razao_social)")
      .order("created_at");

    if (error) return { error: error.message };
    return { success: true, data: data || [] };
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    return { error: "Erro ao buscar atribuições" };
  }
}

export async function getLawyerAssignments(advogadoId: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Acesso negado" };

    const { data, error } = await supabase
      .from("lawyer_assignments")
      .select("client_id")
      .eq("advogado_id", advogadoId);

    if (error) return { error: error.message };
    return { success: true, data: data?.map((a) => a.client_id) || [] };
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    return { error: "Erro ao buscar atribuições" };
  }
}
