"use server";

import { calculateKPIs, type KPIData } from "@/lib/db/queries/kpis";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { translateError } from "@/lib/utils/errors";

export type KpiVisibility = {
  custos?: boolean;
  evitadas?: boolean;
  recebidos?: boolean;
  roi?: boolean;
};

export type SummarySource = "ai" | "fallback" | "manual";

export type ClientNextStepStatus =
  | "pendente"
  | "em_andamento"
  | "aguardando_cliente"
  | "concluido"
  | "cancelado";

export interface ClientNextStep {
  id: string;
  client_id: string;
  case_id: string | null;
  title: string;
  description: string | null;
  owner_name: string | null;
  due_date: string | null;
  status: ClientNextStepStatus;
  visible_to_client: boolean;
  created_at: string;
}

export interface ClientNarratedUpdate {
  id: string;
  case_id: string;
  tipo: string;
  descricao_tecnica: string;
  narrativa_ai: string | null;
  created_at: string;
  processo: string;
  processo_descricao: string;
}

export interface MonthlyReportSummary {
  id: string;
  referencia: string;
  narrativa_ai: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  created_at: string;
}

export interface ClientClaritySnapshot {
  client: {
    id: string;
    razao_social: string;
    responsavel_nome: string | null;
    kpi_visibility: KpiVisibility;
  };
  executiveSummary: {
    text: string;
    source: SummarySource;
    generated_at: string | null;
  };
  nextSteps: ClientNextStep[];
  updates: ClientNarratedUpdate[];
  valueEvidence: KPIData;
  reports: MonthlyReportSummary[];
}

interface ClientRow {
  id: string;
  razao_social: string;
  kpi_visibility: KpiVisibility | null;
  profiles?: Relation<{ nome: string | null }>;
}

interface NextStepRow {
  id: string;
  client_id: string;
  case_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  status: ClientNextStepStatus;
  visible_to_client: boolean;
  created_at: string;
  profiles?: Relation<{ nome: string | null }>;
}

interface UpdateRow {
  id: string;
  case_id: string;
  tipo: string;
  descricao_tecnica: string;
  narrativa_ai: string | null;
  created_at: string;
  cases?: Relation<{ numero_processo: string | null; descricao: string | null }>;
}

interface SummaryRow {
  conteudo: string;
  tipo: string;
  created_at: string;
}

type Relation<T> = T | T[] | null | undefined;

function firstRelation<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation ?? null;
}

function isVisible(
  visibility: KpiVisibility | null | undefined,
  key: keyof KpiVisibility,
) {
  if (!visibility) return true;
  return visibility[key] !== false;
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function buildFallbackSummary(params: {
  clientName: string;
  casesCount: number;
  activeCasesCount: number;
  updatesCount: number;
  kpis: KPIData;
  visibility: KpiVisibility;
}) {
  const visibleFinancials: string[] = [];

  if (isVisible(params.visibility, "evitadas")) {
    visibleFinancials.push(
      `${formatBRL(params.kpis.condenacoes_evitadas)} em condenações evitadas`,
    );
  }

  if (isVisible(params.visibility, "recebidos")) {
    visibleFinancials.push(
      `${formatBRL(params.kpis.valores_recebidos)} em valores recebidos`,
    );
  }

  const financialSentence =
    visibleFinancials.length > 0
      ? `No período analisado, o acompanhamento registra ${visibleFinancials.join(" e ")}.`
      : "Os indicadores financeiros disponíveis foram preservados conforme a configuração de visibilidade do cliente.";

  const updateSentence =
    params.updatesCount > 0
      ? `Há ${params.updatesCount} atualização(ões) recente(s) publicadas para consulta.`
      : "Ainda não há atualização recente publicada no portal.";

  return `${params.clientName} possui ${params.casesCount} processo(s) acompanhado(s), sendo ${params.activeCasesCount} em andamento. ${updateSentence} ${financialSentence} Abaixo estão os próximos passos e os registros mais recentes para manter a empresa orientada sobre a condução jurídica.`;
}

export async function getClientClaritySnapshot(): Promise<{
  success: boolean;
  data?: ClientClaritySnapshot;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Não autenticado" };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, client_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return { success: false, error: translateError(profileError.message) };
    }

    if (!profile?.client_id) {
      return {
        success: false,
        error: "Perfil de cliente não encontrado para este usuário.",
      };
    }

    const clientId = profile.client_id as string;

    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 3);

    const [
      clientRes,
      casesRes,
      nextStepsRes,
      updatesRes,
      reportsRes,
      summaryRes,
      kpis,
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("id, razao_social, kpi_visibility, profiles:responsavel_id(nome)")
        .eq("id", clientId)
        .single(),
      supabase
        .from("cases")
        .select("id, status")
        .eq("client_id", clientId),
      supabase
        .from("client_next_steps")
        .select("id, client_id, case_id, title, description, due_date, status, visible_to_client, created_at, profiles:owner_id(nome)")
        .eq("client_id", clientId)
        .eq("visible_to_client", true)
        .in("status", ["pendente", "em_andamento", "aguardando_cliente"])
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("case_updates")
        .select("id, case_id, tipo, descricao_tecnica, narrativa_ai, created_at, cases(numero_processo, descricao)")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("monthly_reports")
        .select("id, referencia, narrativa_ai, arquivo_url, arquivo_nome, created_at")
        .eq("client_id", clientId)
        .order("referencia", { ascending: false })
        .limit(3),
      supabase
        .from("ai_summaries")
        .select("conteudo, tipo, created_at")
        .eq("client_id", clientId)
        .eq("periodo", "portal_clarity")
        .order("created_at", { ascending: false })
        .limit(1),
      calculateKPIs(clientId, startDate, now),
    ]);

    if (clientRes.error) {
      return { success: false, error: translateError(clientRes.error.message) };
    }

    const client = clientRes.data as unknown as ClientRow | null;
    if (!client) return { success: false, error: "Cliente não encontrado" };

    const visibility = client.kpi_visibility || {};
    const cases = (casesRes.data || []) as Array<{ id: string; status: string }>;
    const activeCasesCount = cases.filter((item) =>
      ["ativo", "em_andamento", "suspenso"].includes(item.status),
    ).length;

    const updates = ((updatesRes.data || []) as unknown as UpdateRow[]).map(
      (update) => {
        const caseInfo = firstRelation(update.cases);
        return {
          id: update.id,
          case_id: update.case_id,
          tipo: update.tipo,
          descricao_tecnica: update.descricao_tecnica,
          narrativa_ai: update.narrativa_ai,
          created_at: update.created_at,
          processo: caseInfo?.numero_processo || "Processo",
          processo_descricao: caseInfo?.descricao || "",
        };
      },
    );

    const cachedSummary = ((summaryRes.data || []) as SummaryRow[])[0];
    const responsibleProfile = firstRelation(client.profiles);
    const summaryText =
      cachedSummary?.conteudo ||
      buildFallbackSummary({
        clientName: client.razao_social,
        casesCount: cases.length,
        activeCasesCount,
        updatesCount: updates.length,
        kpis,
        visibility,
      });

    return {
      success: true,
      data: {
        client: {
          id: client.id,
          razao_social: client.razao_social,
          responsavel_nome: responsibleProfile?.nome || null,
          kpi_visibility: visibility,
        },
        executiveSummary: {
          text: summaryText,
          source: cachedSummary ? "ai" : "fallback",
          generated_at: cachedSummary?.created_at || null,
        },
        nextSteps: ((nextStepsRes.data || []) as unknown as NextStepRow[]).map(
          (step) => {
            const owner = firstRelation(step.profiles);
            return {
              id: step.id,
              client_id: step.client_id,
              case_id: step.case_id,
              title: step.title,
              description: step.description,
              owner_name: owner?.nome || null,
              due_date: step.due_date,
              status: step.status,
              visible_to_client: step.visible_to_client,
              created_at: step.created_at,
            };
          },
        ),
        updates,
        valueEvidence: {
          custos: isVisible(visibility, "custos") ? kpis.custos : 0,
          condenacoes_evitadas: isVisible(visibility, "evitadas")
            ? kpis.condenacoes_evitadas
            : 0,
          valores_recebidos: isVisible(visibility, "recebidos")
            ? kpis.valores_recebidos
            : 0,
          roi: isVisible(visibility, "roi") ? kpis.roi : 0,
        },
        reports: (reportsRes.data || []) as MonthlyReportSummary[],
      },
    };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: translateError(err.message) };
    }
    return { success: false, error: "Erro ao carregar portal do cliente" };
  }
}
