"use server";

import { generateText } from "./gemini";

interface CaseContext {
  numero_processo: string;
  descricao: string;
  fase: string;
  status: string;
  valor_pleiteado_contra: number;
  valor_condenado_contra: number;
  valor_condenacao_favoravel: number;
  valor_acordo_recebido: number;
}

interface UpdateContext {
  tipo: string;
  descricao_tecnica: string;
  dados_alteracao?: Record<string, unknown>;
}

const TIPO_LABELS: Record<string, string> = {
  status_change: "mudança de status",
  fase_change: "mudança de fase",
  valor_change: "atualização de valores",
  observacao: "observação",
  documento: "novo documento",
  audiencia: "audiência",
};

/**
 * Gera uma narrativa amigável para o cliente a partir de uma atualização de processo.
 */
export async function generateUpdateNarrative(
  caseCtx: CaseContext,
  update: UpdateContext,
  clientName: string,
): Promise<string> {
  const formatBRL = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const prompt = `Você é o assistente de comunicação do escritório Fontes Figueiredo Advogados.

Gere um texto CURTO (2-4 frases) explicando a atualização abaixo para um cliente empresa, em linguagem simples e positiva. O cliente não é advogado — evite jargão jurídico. Destaque o impacto prático e financeiro quando houver. Não cumprimente nem assine.

DADOS DO PROCESSO:
- Número: ${caseCtx.numero_processo}
- Descrição: ${caseCtx.descricao}
- Fase atual: ${caseCtx.fase}
- Status: ${caseCtx.status}
- Valor pleiteado contra a empresa: ${formatBRL(caseCtx.valor_pleiteado_contra)}
- Valor condenado: ${formatBRL(caseCtx.valor_condenado_contra)}
- Valor de condenação favorável: ${formatBRL(caseCtx.valor_condenacao_favoravel)}
- Valor de acordo recebido: ${formatBRL(caseCtx.valor_acordo_recebido)}

ATUALIZAÇÃO:
- Tipo: ${TIPO_LABELS[update.tipo] || update.tipo}
- Descrição técnica: ${update.descricao_tecnica}
${update.dados_alteracao ? `- Dados da alteração: ${JSON.stringify(update.dados_alteracao)}` : ""}

CLIENTE: ${clientName}

Responda APENAS com o texto narrativo, sem aspas, sem título, sem prefixo.`;

  try {
    const narrative = await generateText(prompt);
    return narrative.trim();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Erro ao gerar narrativa AI:", msg);
    // Retorna null em vez de duplicar o texto técnico
    return null as unknown as string;
  }
}

/**
 * Gera insight para o advogado sobre um cliente.
 */
export async function generateLawyerInsight(
  clientName: string,
  kpis: { custos: number; evitadas: number; recebidos: number; roi: number },
  recentUpdates: Array<{ tipo: string; descricao_tecnica: string; created_at: string }>,
  daysSinceLastUpdate: number,
): Promise<string> {
  const formatBRL = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const updatesText = recentUpdates.length > 0
    ? recentUpdates.map((u) => `- ${u.created_at}: ${u.descricao_tecnica}`).join("\n")
    : "Nenhuma atualização recente.";

  const prompt = `Você é o assistente interno do escritório Fontes Figueiredo Advogados.

Gere um insight CURTO (3-5 bullet points) para o advogado responsável pelo cliente abaixo. Seja direto, identifique riscos, oportunidades e ações recomendadas. Use linguagem profissional entre colegas.

CLIENTE: ${clientName}
KPIs ATUAIS:
- Custos da assessoria: ${formatBRL(kpis.custos)}
- Condenações evitadas: ${formatBRL(kpis.evitadas)}
- Valores recebidos: ${formatBRL(kpis.recebidos)}
- ROI: ${kpis.roi === Infinity ? "∞" : (kpis.roi * 100).toFixed(1) + "%"}

ÚLTIMAS ATUALIZAÇÕES:
${updatesText}

DIAS SEM ATUALIZAÇÃO: ${daysSinceLastUpdate}

${daysSinceLastUpdate > 30 ? "⚠️ ALERTA: O cliente está há mais de 30 dias sem receber novidades." : ""}

Responda APENAS com os bullet points, sem título, sem prefixo.`;

  try {
    return (await generateText(prompt)).trim();
  } catch (error) {
    console.error("Erro ao gerar insight AI:", error);
    return `Cliente ${clientName} — ${daysSinceLastUpdate} dias sem atualização.`;
  }
}
