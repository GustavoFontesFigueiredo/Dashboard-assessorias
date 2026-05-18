"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { generateUpdateNarrative } from "@/lib/ai/narratives";
import { translateError } from "@/lib/utils/errors";

export interface CaseUpdateInput {
  caseId: string;
  tipo: string;
  descricaoTecnica: string;
  dadosAlteracao?: Record<string, unknown>;
}

/**
 * Cria uma atualização na timeline do processo e gera narrativa AI.
 */
export async function createCaseUpdate(input: CaseUpdateInput) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    // Buscar dados do processo
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("*, clients(razao_social)")
      .eq("id", input.caseId)
      .single();

    if (caseError || !caseData) return { error: "Processo não encontrado" };

    const clientName = (caseData.clients as { razao_social: string })?.razao_social || "Cliente";

    // Gerar narrativa AI
    const narrativa = await generateUpdateNarrative(
      {
        numero_processo: caseData.numero_processo,
        descricao: caseData.descricao || "",
        fase: caseData.fase,
        status: caseData.status,
        valor_pleiteado_contra: caseData.valor_pleiteado_contra,
        valor_condenado_contra: caseData.valor_condenado_contra,
        valor_condenacao_favoravel: caseData.valor_condenacao_favoravel,
        valor_acordo_recebido: caseData.valor_acordo_recebido,
      },
      {
        tipo: input.tipo,
        descricao_tecnica: input.descricaoTecnica,
        dados_alteracao: input.dadosAlteracao,
      },
      clientName,
    );

    // Inserir atualização
    const { data, error } = await supabase
      .from("case_updates")
      .insert({
        case_id: input.caseId,
        client_id: caseData.client_id,
        author_id: user.id,
        tipo: input.tipo,
        descricao_tecnica: input.descricaoTecnica,
        narrativa_ai: narrativa,
        dados_alteracao: input.dadosAlteracao || {},
      })
      .select()
      .single();

    if (error) return { error: translateError(error.message) };

    revalidatePath("/admin/cases");
    revalidatePath("/portal/cases");
    return { success: true, data };
  } catch (err) {
    if (err instanceof Error) return { error: translateError(err.message) };
    return { error: "Erro ao criar atualização" };
  }
}

/**
 * Lista atualizações (timeline) de um processo.
 */
export async function listCaseUpdates(caseId: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const { data, error } = await supabase
      .from("case_updates")
      .select("*, profiles:author_id(nome)")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });

    if (error) return { error: translateError(error.message) };

    return {
      success: true,
      data: (data || []).map((u) => ({
        ...u,
        author_name: (u.profiles as { nome: string } | null)?.nome || "Sistema",
      })),
    };
  } catch (err) {
    if (err instanceof Error) return { error: translateError(err.message) };
    return { error: "Erro ao listar atualizações" };
  }
}

/**
 * Exclui uma atualização da timeline. Apenas admin e controller.
 */
export async function deleteCaseUpdate(updateId: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    // Verificar role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "controller"].includes(profile.role)) {
      return { error: "Sem permissão para excluir atualizações" };
    }

    const { error } = await supabase
      .from("case_updates")
      .delete()
      .eq("id", updateId);

    if (error) return { error: translateError(error.message) };

    revalidatePath("/admin/cases");
    return { success: true };
  } catch (err) {
    if (err instanceof Error) return { error: translateError(err.message) };
    return { error: "Erro ao excluir atualização" };
  }
}

/**
 * Lista atualizações recentes de todos os processos de um cliente (para o portal).
 */
export async function listClientUpdates(clientId: string, limit = 20) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const { data, error } = await supabase
      .from("case_updates")
      .select("*, cases(numero_processo, descricao), profiles:author_id(nome)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { error: translateError(error.message) };

    return {
      success: true,
      data: (data || []).map((u) => ({
        ...u,
        processo: (u.cases as { numero_processo: string; descricao: string } | null)?.numero_processo || "",
        processo_descricao: (u.cases as { numero_processo: string; descricao: string } | null)?.descricao || "",
        author_name: (u.profiles as { nome: string } | null)?.nome || "Sistema",
      })),
    };
  } catch (err) {
    if (err instanceof Error) return { error: translateError(err.message) };
    return { error: "Erro ao listar atualizações" };
  }
}
