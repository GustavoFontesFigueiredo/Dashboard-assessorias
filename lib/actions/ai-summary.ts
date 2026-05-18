"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/gemini";
import { translateError } from "@/lib/utils/errors";

/**
 * Gera um resumo narrativo do cenário jurídico atual do cliente via IA.
 */
export async function getAiDashboardSummary(clientId: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    // Buscar dados consolidados
    const [clientRes, casesRes, costsRes, receiptsRes, updatesRes] =
      await Promise.all([
        supabase
          .from("clients")
          .select("razao_social")
          .eq("id", clientId)
          .single(),
        supabase
          .from("cases")
          .select(
            "numero_processo, fase, status, valor_pleiteado_contra, valor_condenado_contra, valor_condenacao_favoravel, valor_acordo_recebido",
          )
          .eq("client_id", clientId),
        supabase
          .from("case_costs")
          .select("valor")
          .eq("client_id", clientId),
        supabase
          .from("case_receipts")
          .select("valor")
          .eq("client_id", clientId),
        supabase
          .from("case_updates")
          .select("tipo, descricao_tecnica, created_at")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

    const client = clientRes.data;
    const cases = casesRes.data || [];
    const costs = costsRes.data || [];
    const receipts = receiptsRes.data || [];
    const updates = updatesRes.data || [];

    const fmt = (v: number) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(v);

    const totalCustos = costs.reduce((s, c) => s + Number(c.valor), 0);
    const totalEvitadas = cases.reduce(
      (s, c) =>
        s +
        Math.max(
          0,
          Number(c.valor_pleiteado_contra) - Number(c.valor_condenado_contra),
        ),
      0,
    );
    const totalRecebidos =
      receipts.reduce((s, r) => s + Number(r.valor), 0) +
      cases.reduce((s, c) => s + Number(c.valor_condenacao_favoravel), 0);

    const casosAtivos = cases.filter((c) => c.status === "ativo").length;
    const casosEncerrados = cases.filter((c) => c.status === "encerrado").length;

    const updatesText = updates
      .map(
        (u) =>
          `- ${new Date(u.created_at).toLocaleDateString("pt-BR")}: [${u.tipo}] ${u.descricao_tecnica}`,
      )
      .join("\n");

    const prompt = `Você é o assistente jurídico do escritório Fontes Figueiredo Advogados.
Gere um BREVE resumo narrativo (3-5 frases) sobre a situação jurídica atual do cliente, em linguagem simples e acessível.

DADOS:
- Empresa: ${client?.razao_social || "Cliente"}
- Processos: ${cases.length} total (${casosAtivos} ativos, ${casosEncerrados} encerrados)
- Custos da assessoria: ${fmt(totalCustos)}
- Condenações evitadas: ${fmt(totalEvitadas)}
- Valores recebidos: ${fmt(totalRecebidos)}
- ROI: ${totalCustos > 0 ? ((totalEvitadas + totalRecebidos) / totalCustos * 100).toFixed(1) + "%" : "N/A"}

ÚLTIMAS MOVIMENTAÇÕES:
${updatesText || "Nenhuma movimentação recente."}

REGRAS:
- Português brasileiro, linguagem simples
- Destaque números positivos (economia, recebimentos)
- Seja otimista mas honesto
- Máximo 5 frases
- NÃO use markdown, apenas texto puro`;

    const summary = await generateText(prompt);
    return { success: true, summary: summary.trim() };
  } catch (err) {
    if (err instanceof Error) return { error: translateError(err.message) };
    return { error: "Erro ao gerar resumo" };
  }
}
