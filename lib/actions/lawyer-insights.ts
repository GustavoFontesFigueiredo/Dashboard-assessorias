"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { generateLawyerInsight } from "@/lib/ai/narratives";
import { translateError } from "@/lib/utils/errors";

interface ClientInsight {
  clientId: string;
  clientName: string;
  totalCases: number;
  activeCases: number;
  daysSinceLastUpdate: number;
  inactive: boolean; // >30 dias sem atualização
  insight: string;
  kpis: {
    custos: number;
    evitadas: number;
    recebidos: number;
    roi: number;
  };
}

/**
 * Retorna lista de clientes do advogado com alerta de inatividade.
 * Não gera insight IA (só dados crus) — para uso rápido no dashboard.
 */
export async function getInactivityAlerts(userId?: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const targetUserId = userId || user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", targetUserId)
      .single();

    // Determinar clientes a analisar
    let clientIds: string[] = [];

    if (profile?.role === "advogado") {
      const { data: assignments } = await supabase
        .from("lawyer_assignments")
        .select("client_id")
        .eq("profile_id", targetUserId);
      clientIds = (assignments || []).map((a) => a.client_id);
    } else if (profile?.role === "admin" || profile?.role === "controller") {
      const { data: clients } = await supabase
        .from("clients")
        .select("id")
        .eq("ativo", true);
      clientIds = (clients || []).map((c) => c.id);
    }

    if (clientIds.length === 0) return { success: true, data: [] };

    const now = new Date();
    const alerts: Array<{
      clientId: string;
      clientName: string;
      totalCases: number;
      activeCases: number;
      daysSinceLastUpdate: number;
      inactive: boolean;
      lastUpdateDate: string | null;
    }> = [];

    for (const clientId of clientIds) {
      const [clientRes, casesRes, lastUpdateRes] = await Promise.all([
        supabase.from("clients").select("razao_social").eq("id", clientId).single(),
        supabase.from("cases").select("id, status").eq("client_id", clientId),
        supabase
          .from("case_updates")
          .select("created_at")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      const cases = casesRes.data || [];
      const lastUpdate = lastUpdateRes.data?.[0]?.created_at || null;
      const daysSince = lastUpdate
        ? Math.floor((now.getTime() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      alerts.push({
        clientId,
        clientName: clientRes.data?.razao_social || "Desconhecido",
        totalCases: cases.length,
        activeCases: cases.filter((c) => c.status === "ativo").length,
        daysSinceLastUpdate: daysSince,
        inactive: daysSince > 30,
        lastUpdateDate: lastUpdate
          ? new Date(lastUpdate).toLocaleDateString("pt-BR")
          : null,
      });
    }

    // Ordenar por mais inativos primeiro
    alerts.sort((a, b) => b.daysSinceLastUpdate - a.daysSinceLastUpdate);

    return { success: true, data: alerts };
  } catch (err) {
    if (err instanceof Error) return { error: translateError(err.message) };
    return { error: "Erro ao buscar alertas" };
  }
}

/**
 * Gera insight IA completo para um cliente específico do advogado.
 */
export async function getClientInsight(clientId: string): Promise<{ success?: boolean; data?: ClientInsight; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const now = new Date();

    const [clientRes, casesRes, costsRes, receiptsRes, updatesRes] =
      await Promise.all([
        supabase.from("clients").select("razao_social").eq("id", clientId).single(),
        supabase
          .from("cases")
          .select("id, status, valor_pleiteado_contra, valor_condenado_contra, valor_condenacao_favoravel")
          .eq("client_id", clientId),
        supabase.from("case_costs").select("valor").eq("client_id", clientId),
        supabase.from("case_receipts").select("valor").eq("client_id", clientId),
        supabase
          .from("case_updates")
          .select("tipo, descricao_tecnica, created_at")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    const clientName = clientRes.data?.razao_social || "Desconhecido";
    const cases = casesRes.data || [];
    const costs = costsRes.data || [];
    const receipts = receiptsRes.data || [];
    const updates = updatesRes.data || [];

    const custos = costs.reduce((s, c) => s + Number(c.valor), 0);
    const evitadas = cases.reduce(
      (s, c) => s + Math.max(0, Number(c.valor_pleiteado_contra) - Number(c.valor_condenado_contra)),
      0,
    );
    const recebidos =
      receipts.reduce((s, r) => s + Number(r.valor), 0) +
      cases.reduce((s, c) => s + Number(c.valor_condenacao_favoravel), 0);
    const roi = custos > 0 ? (evitadas + recebidos) / custos : Infinity;

    const lastUpdate = updates[0]?.created_at || null;
    const daysSince = lastUpdate
      ? Math.floor((now.getTime() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Gerar insight via IA
    const insight = await generateLawyerInsight(
      clientName,
      { custos, evitadas, recebidos, roi },
      updates.map((u) => ({
        tipo: u.tipo,
        descricao_tecnica: u.descricao_tecnica,
        created_at: new Date(u.created_at).toLocaleDateString("pt-BR"),
      })),
      daysSince,
    );

    return {
      success: true,
      data: {
        clientId,
        clientName,
        totalCases: cases.length,
        activeCases: cases.filter((c) => c.status === "ativo").length,
        daysSinceLastUpdate: daysSince,
        inactive: daysSince > 30,
        insight,
        kpis: { custos, evitadas, recebidos, roi },
      },
    };
  } catch (err) {
    if (err instanceof Error) return { error: translateError(err.message) };
    return { error: "Erro ao gerar insight" };
  }
}

/**
 * Gera o digest semanal consolidado para o advogado logado.
 */
export async function getWeeklyDigest() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    // Buscar alertas
    const alertsResult = await getInactivityAlerts(user.id);
    if (alertsResult.error) return { error: alertsResult.error };

    const alerts = alertsResult.data || [];
    const inactiveCount = alerts.filter((a) => a.inactive).length;
    const totalCases = alerts.reduce((s, a) => s + a.totalCases, 0);
    const activeCases = alerts.reduce((s, a) => s + a.activeCases, 0);

    // Buscar atualizações da última semana
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const clientIds = alerts.map((a) => a.clientId);
    let weekUpdates = 0;

    if (clientIds.length > 0) {
      const { count } = await supabase
        .from("case_updates")
        .select("id", { count: "exact", head: true })
        .in("client_id", clientIds)
        .gte("created_at", weekAgo.toISOString());
      weekUpdates = count || 0;
    }

    return {
      success: true,
      data: {
        totalClients: alerts.length,
        totalCases,
        activeCases,
        inactiveClients: inactiveCount,
        weekUpdates,
        alerts: alerts.slice(0, 10), // Top 10 mais inativos
      },
    };
  } catch (err) {
    if (err instanceof Error) return { error: translateError(err.message) };
    return { error: "Erro ao gerar digest" };
  }
}
