"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface KPIData {
  custos: number;
  condenacoes_evitadas: number;
  valores_recebidos: number;
  roi: number;
}

/**
 * Calcula custos no período
 */
export async function calculateCostos(
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const { data, error } = await supabase
    .from("case_costs")
    .select("valor", { count: "exact" })
    .eq("client_id", clientId)
    .gte("data_competencia", startDate.toISOString().split("T")[0])
    .lte("data_competencia", endDate.toISOString().split("T")[0]);

  if (error) {
    console.error("Erro ao calcular custos:", error);
    return 0;
  }

  return (data || []).reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
}

/**
 * Calcula condenações evitadas no período
 * = valor_pleiteado_contra - valor_condenado_contra
 */
export async function calculateCondenacoes(
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const { data, error } = await supabase
    .from("cases")
    .select("valor_pleiteado_contra, valor_condenado_contra")
    .eq("client_id", clientId)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  if (error) {
    console.error("Erro ao calcular condenações:", error);
    return 0;
  }

  return (data || []).reduce((sum, item) => {
    const pleiteado = Number(item.valor_pleiteado_contra) || 0;
    const condenado = Number(item.valor_condenado_contra) || 0;
    return sum + Math.max(0, pleiteado - condenado);
  }, 0);
}

/**
 * Calcula valores recebidos no período
 * = case_receipts + valor_condenacao_favoravel dos cases
 */
export async function calculateValoresRecebidos(
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // Recebimentos diretos
  const { data: receipts, error: errorReceipts } = await supabase
    .from("case_receipts")
    .select("valor")
    .eq("client_id", clientId)
    .gte("data", startDate.toISOString().split("T")[0])
    .lte("data", endDate.toISOString().split("T")[0]);

  if (errorReceipts) {
    console.error("Erro ao buscar recebimentos:", errorReceipts);
  }

  const receiptsTotal = (receipts || []).reduce(
    (sum, item) => sum + (Number(item.valor) || 0),
    0
  );

  // Condenações favoráveis
  const { data: cases, error: errorCases } = await supabase
    .from("cases")
    .select("valor_condenacao_favoravel")
    .eq("client_id", clientId)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  if (errorCases) {
    console.error("Erro ao buscar cases:", errorCases);
  }

  const casesTotal = (cases || []).reduce(
    (sum, item) => sum + (Number(item.valor_condenacao_favoravel) || 0),
    0
  );

  return receiptsTotal + casesTotal;
}

/**
 * Calcula ROI no período
 * = (condenações_evitadas + valores_recebidos) / custos
 */
export async function calculateROI(
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const custos = await calculateCostos(clientId, startDate, endDate);
  const condenacoes = await calculateCondenacoes(clientId, startDate, endDate);
  const recebidos = await calculateValoresRecebidos(clientId, startDate, endDate);

  if (custos === 0) {
    return recebidos + condenacoes > 0 ? Infinity : 0;
  }

  return (condenacoes + recebidos) / custos;
}

/**
 * Calcula todos os KPIs para um cliente no período
 */
export async function calculateKPIs(
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<KPIData> {
  const [custos, condenacoes, recebidos] = await Promise.all([
    calculateCostos(clientId, startDate, endDate),
    calculateCondenacoes(clientId, startDate, endDate),
    calculateValoresRecebidos(clientId, startDate, endDate),
  ]);

  const roi = custos === 0 ? (recebidos + condenacoes > 0 ? Infinity : 0) : (condenacoes + recebidos) / custos;

  return {
    custos,
    condenacoes_evitadas: condenacoes,
    valores_recebidos: recebidos,
    roi,
  };
}

/**
 * Retorna dados de custos por mês para um gráfico
 */
export async function getCostosTimeSeries(
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{ mes: string; valor: number }>> {
  const { data, error } = await supabase
    .from("case_costs")
    .select("valor, data_competencia")
    .eq("client_id", clientId)
    .gte("data_competencia", startDate.toISOString().split("T")[0])
    .lte("data_competencia", endDate.toISOString().split("T")[0])
    .order("data_competencia");

  if (error) {
    console.error("Erro ao buscar série temporal:", error);
    return [];
  }

  const grouped: Record<string, number> = {};

  (data || []).forEach((item) => {
    const date = new Date(item.data_competencia);
    const mes = date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
    grouped[mes] = (grouped[mes] || 0) + (Number(item.valor) || 0);
  });

  return Object.entries(grouped).map(([mes, valor]) => ({
    mes,
    valor,
  }));
}

/**
 * Retorna dados de recebimentos por mês para um gráfico
 */
export async function getRecebimentosTimeSeries(
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{ mes: string; valor: number }>> {
  const { data, error } = await supabase
    .from("case_receipts")
    .select("valor, data")
    .eq("client_id", clientId)
    .gte("data", startDate.toISOString().split("T")[0])
    .lte("data", endDate.toISOString().split("T")[0])
    .order("data");

  if (error) {
    console.error("Erro ao buscar série temporal:", error);
    return [];
  }

  const grouped: Record<string, number> = {};

  (data || []).forEach((item) => {
    const date = new Date(item.data);
    const mes = date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
    grouped[mes] = (grouped[mes] || 0) + (Number(item.valor) || 0);
  });

  return Object.entries(grouped).map(([mes, valor]) => ({
    mes,
    valor,
  }));
}

/**
 * Retorna status de casos (resumo por status)
 */
export async function getCasesStatusSummary(clientId: string): Promise<
  Array<{ status: string; count: number }>
> {
  const { data, error } = await supabase
    .from("cases")
    .select("status")
    .eq("client_id", clientId);

  if (error) {
    console.error("Erro ao buscar summary:", error);
    return [];
  }

  const grouped: Record<string, number> = {};

  (data || []).forEach((item) => {
    grouped[item.status] = (grouped[item.status] || 0) + 1;
  });

  return Object.entries(grouped).map(([status, count]) => ({
    status,
    count,
  }));
}
