"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateText } from "@/lib/ai/gemini";
import { translateError } from "@/lib/utils/errors";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement as h } from "react";
import { MonthlyReportPDF } from "@/lib/pdf/monthly-report-template";
import { calculateKPIs } from "@/lib/db/queries/kpis";

/**
 * Gera o relatório mensal de um cliente com narrativa IA e salva como PDF.
 */
export async function generateMonthlyReport(
  clientId: string,
  referencia: string, // "2026-05"
) {
  try {
    const supabase = await getSupabaseServerClient();
    const admin = getSupabaseAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    // Verificar permissão
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "controller"].includes(profile.role)) {
      return { error: "Sem permissão para gerar relatórios" };
    }

    // Verificar se já existe
    const { data: existing } = await supabase
      .from("monthly_reports")
      .select("id")
      .eq("client_id", clientId)
      .eq("referencia", referencia)
      .single();

    if (existing) {
      return { error: `Relatório de ${referencia} já existe para este cliente` };
    }

    // Buscar dados do cliente
    const { data: clientData } = await supabase
      .from("clients")
      .select("razao_social, cnpj")
      .eq("id", clientId)
      .single();

    if (!clientData) return { error: "Cliente não encontrado" };

    // Período do mês de referência
    const parts = referencia.split("-").map(Number);
    const year = parts[0] ?? 2026;
    const month = parts[1] ?? 1;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // KPIs do período
    const kpis = await calculateKPIs(clientId, startDate, endDate);

    // Buscar processos
    const { data: cases } = await supabase
      .from("cases")
      .select(
        "numero_processo, descricao, fase, status, valor_pleiteado_contra, valor_condenado_contra, valor_condenacao_favoravel, valor_acordo_recebido",
      )
      .eq("client_id", clientId);

    // Buscar atualizações do mês
    const { data: updates } = await supabase
      .from("case_updates")
      .select("tipo, descricao_tecnica, narrativa_ai, created_at")
      .eq("client_id", clientId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: false });

    const casesList = cases || [];
    const updatesList = updates || [];

    const fmt = (v: number) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(v);

    const mesLabel = startDate.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });

    // Gerar narrativa IA
    let narrativa = "";
    try {
      const updatesText = updatesList
        .map(
          (u) =>
            `- ${new Date(u.created_at).toLocaleDateString("pt-BR")}: [${u.tipo}] ${u.descricao_tecnica}`,
        )
        .join("\n");

      const casosAtivos = casesList.filter((c) => c.status === "ativo").length;

      const prompt = `Você é o assistente jurídico do escritório Fontes Figueiredo Advogados.
Escreva um RELATÓRIO NARRATIVO MENSAL (6-10 frases) sobre a situação jurídica do cliente no mês de referência.

DADOS DO MÊS (${mesLabel}):
- Empresa: ${clientData.razao_social}
- Processos: ${casesList.length} total (${casosAtivos} ativos)
- Custos da assessoria no mês: ${fmt(kpis.custos)}
- Condenações evitadas no mês: ${fmt(kpis.condenacoes_evitadas)}
- Valores recebidos no mês: ${fmt(kpis.valores_recebidos)}
- ROI acumulado: ${kpis.custos > 0 ? ((kpis.condenacoes_evitadas + kpis.valores_recebidos) / kpis.custos * 100).toFixed(1) + "%" : "N/A"}

MOVIMENTAÇÕES DO MÊS:
${updatesText || "Nenhuma movimentação registrada neste mês."}

REGRAS:
- Português brasileiro, linguagem acessível para não-advogados
- Comece com uma saudação breve ("Prezado(a) cliente,")
- Resuma o que aconteceu no mês
- Destaque resultados positivos (economia, vitórias)
- Mencione processos relevantes pelo número quando houver movimentação
- Finalize com perspectiva para o próximo período
- NÃO use markdown, apenas texto puro
- Máximo 10 frases`;

      narrativa = (await generateText(prompt)).trim();
    } catch {
      narrativa =
        `Prezado(a) cliente, este é o relatório mensal referente a ${mesLabel}. ` +
        `No período, sua assessoria jurídica acompanhou ${casesList.length} processo(s). ` +
        `O investimento na assessoria foi de ${fmt(kpis.custos)}, ` +
        `com ${fmt(kpis.condenacoes_evitadas)} em condenações evitadas ` +
        `e ${fmt(kpis.valores_recebidos)} em valores recebidos a seu favor.`;
    }

    // Gerar PDF
    const doc = h(MonthlyReportPDF, {
      clientName: clientData.razao_social,
      cnpj: clientData.cnpj,
      referencia: mesLabel,
      narrativa,
      kpis,
      cases: casesList,
      updates: updatesList.map((u) => ({
        data: new Date(u.created_at).toLocaleDateString("pt-BR"),
        tipo: u.tipo,
        descricao: u.narrativa_ai || u.descricao_tecnica,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    const buffer = await renderToBuffer(doc);

    // Upload para Supabase Storage
    const fileName = `${clientId}/${referencia}.pdf`;
    const { error: uploadError } = await admin.storage
      .from("reports")
      .upload(fileName, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      return { error: `Erro ao salvar PDF: ${translateError(uploadError.message)}` };
    }

    // Gerar URL assinada (válida por 1 ano)
    const { data: urlData } = await admin.storage
      .from("reports")
      .createSignedUrl(fileName, 60 * 60 * 24 * 365);

    const arquivoNome = `relatorio-${clientData.razao_social.replace(/\s+/g, "-").toLowerCase()}-${referencia}.pdf`;

    // Salvar registro
    const { data, error } = await supabase
      .from("monthly_reports")
      .insert({
        client_id: clientId,
        referencia,
        narrativa_ai: narrativa,
        arquivo_url: urlData?.signedUrl || "",
        arquivo_nome: arquivoNome,
        generated_by: user.id,
      })
      .select()
      .single();

    if (error) return { error: translateError(error.message) };

    revalidatePath("/admin/reports");
    revalidatePath("/portal");
    return { success: true, data };
  } catch (err) {
    if (err instanceof Error) return { error: translateError(err.message) };
    return { error: "Erro ao gerar relatório mensal" };
  }
}

/**
 * Lista relatórios mensais de um cliente.
 */
export async function listMonthlyReports(clientId: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const { data, error } = await supabase
      .from("monthly_reports")
      .select("id, referencia, narrativa_ai, arquivo_url, arquivo_nome, created_at")
      .eq("client_id", clientId)
      .order("referencia", { ascending: false });

    if (error) return { error: translateError(error.message) };
    return { success: true, data: data || [] };
  } catch (err) {
    if (err instanceof Error) return { error: translateError(err.message) };
    return { error: "Erro ao listar relatórios" };
  }
}

/**
 * Lista todos os clientes com status dos relatórios do mês atual.
 */
export async function listClientsReportStatus() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "controller"].includes(profile.role)) {
      return { error: "Sem permissão" };
    }

    const now = new Date();
    const currentRef = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const { data: clients } = await supabase
      .from("clients")
      .select("id, razao_social, cnpj")
      .eq("ativo", true)
      .order("razao_social");

    const { data: reports } = await supabase
      .from("monthly_reports")
      .select("client_id, referencia")
      .eq("referencia", currentRef);

    const reportMap = new Set(
      (reports || []).map((r) => r.client_id),
    );

    return {
      success: true,
      currentRef,
      data: (clients || []).map((c) => ({
        ...c,
        has_report: reportMap.has(c.id),
      })),
    };
  } catch (err) {
    if (err instanceof Error) return { error: translateError(err.message) };
    return { error: "Erro ao listar status" };
  }
}

/**
 * Exclui um relatório mensal.
 */
export async function deleteMonthlyReport(reportId: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const admin = getSupabaseAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "controller"].includes(profile.role)) {
      return { error: "Sem permissão" };
    }

    // Buscar relatório para deletar o arquivo
    const { data: report } = await supabase
      .from("monthly_reports")
      .select("client_id, referencia")
      .eq("id", reportId)
      .single();

    if (report) {
      const fileName = `${report.client_id}/${report.referencia}.pdf`;
      await admin.storage.from("reports").remove([fileName]);
    }

    const { error } = await supabase
      .from("monthly_reports")
      .delete()
      .eq("id", reportId);

    if (error) return { error: translateError(error.message) };

    revalidatePath("/admin/reports");
    return { success: true };
  } catch (err) {
    if (err instanceof Error) return { error: translateError(err.message) };
    return { error: "Erro ao excluir relatório" };
  }
}
