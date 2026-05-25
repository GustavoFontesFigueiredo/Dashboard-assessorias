"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface KPIData {
  custos: number;
  condenacoes_evitadas: number;
  valores_recebidos: number;
  roi: number;
}

export async function calculateKPIs(
  clientId: string,
  startDate: Date,
  endDate: Date,
): Promise<KPIData> {
  const supabase = await getSupabaseServerClient();
  const start = startDate.toISOString().split("T")[0];
  const end = endDate.toISOString().split("T")[0];

  const [{ data: costs }, { data: cases }, { data: receipts }] = await Promise.all([
    supabase
      .from("case_costs")
      .select("valor")
      .eq("client_id", clientId)
      .gte("data_competencia", start)
      .lte("data_competencia", end),
    supabase
      .from("cases")
      .select("valor_pleiteado_contra, valor_condenado_contra, valor_condenacao_favoravel")
      .eq("client_id", clientId),
    supabase
      .from("case_receipts")
      .select("valor")
      .eq("client_id", clientId)
      .gte("data", start)
      .lte("data", end),
  ]);

  const custos = (costs ?? []).reduce((s, r) => s + Number(r.valor), 0);
  const condenacoes_evitadas = (cases ?? []).reduce((s, r) => {
    return s + Math.max(0, Number(r.valor_pleiteado_contra) - Number(r.valor_condenado_contra));
  }, 0);
  const valores_recebidos =
    (receipts ?? []).reduce((s, r) => s + Number(r.valor), 0) +
    (cases ?? []).reduce((s, r) => s + Number(r.valor_condenacao_favoravel), 0);
  const roi = custos === 0
    ? (valores_recebidos + condenacoes_evitadas > 0 ? Infinity : 0)
    : (condenacoes_evitadas + valores_recebidos) / custos;

  return { custos, condenacoes_evitadas, valores_recebidos, roi };
}

export async function getCostosTimeSeries(
  clientId: string,
  startDate: Date,
  endDate: Date,
): Promise<Array<{ mes: string; valor: number }>> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("case_costs")
    .select("valor, data_competencia")
    .eq("client_id", clientId)
    .gte("data_competencia", startDate.toISOString().split("T")[0])
    .lte("data_competencia", endDate.toISOString().split("T")[0])
    .order("data_competencia");

  const grouped: Record<string, number> = {};
  (data ?? []).forEach((item) => {
    const mes = new Date(item.data_competencia).toLocaleDateString("pt-BR", {
      month: "short", year: "numeric",
    });
    grouped[mes] = (grouped[mes] || 0) + Number(item.valor);
  });
  return Object.entries(grouped).map(([mes, valor]) => ({ mes, valor }));
}

export async function getRecebimentosTimeSeries(
  clientId: string,
  startDate: Date,
  endDate: Date,
): Promise<Array<{ mes: string; valor: number }>> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("case_receipts")
    .select("valor, data")
    .eq("client_id", clientId)
    .gte("data", startDate.toISOString().split("T")[0])
    .lte("data", endDate.toISOString().split("T")[0])
    .order("data");

  const grouped: Record<string, number> = {};
  (data ?? []).forEach((item) => {
    const mes = new Date(item.data).toLocaleDateString("pt-BR", {
      month: "short", year: "numeric",
    });
    grouped[mes] = (grouped[mes] || 0) + Number(item.valor);
  });
  return Object.entries(grouped).map(([mes, valor]) => ({ mes, valor }));
}

export async function getCasesStatusSummary(
  clientId: string,
): Promise<Array<{ status: string; count: number }>> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("cases")
    .select("status")
    .eq("client_id", clientId);

  const grouped: Record<string, number> = {};
  (data ?? []).forEach((item) => {
    grouped[item.status] = (grouped[item.status] || 0) + 1;
  });
  return Object.entries(grouped).map(([status, count]) => ({ status, count }));
}
