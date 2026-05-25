"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/getSession";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  meetingMinuteCreateSchema,
  meetingMinuteUpdateSchema,
  meetingMinuteCategoryUpdateSchema,
  spotlightItemCreateSchema,
  spotlightItemUpdateSchema,
  meetingTaskCreateSchema,
  meetingTaskUpdateSchema,
  type MeetingMinuteCreateInput,
  type MeetingMinuteUpdateInput,
  type MeetingMinuteCategoryUpdateInput,
  type SpotlightItemCreateInput,
  type SpotlightItemUpdateInput,
  type MeetingTaskCreateInput,
  type MeetingTaskUpdateInput,
} from "@/lib/validators/meeting-minute";

interface ProfileName {
  id: string;
  nome: string;
}

interface MeetingMinuteRow {
  id: string;
  responsavel_id: string;
  created_by: string | null;
  meeting_date: string;
  due_at: string | null;
  scope: string | null;
  participants: string[] | null;
  status: string;
  timebox_minutes: number;
  summary: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ClientRow {
  id: string;
  razao_social: string;
  responsavel_id: string | null;
}

interface CaseRow {
  id: string;
  client_id: string;
  numero_processo: string;
  descricao: string | null;
  status: string;
  created_at: string;
}

interface SpotlightItemRow {
  id: string;
  meeting_minute_id: string;
  client_id: string | null;
  case_id: string | null;
  reason: string;
  discussion_notes: string | null;
  decision_text: string | null;
  owner_id: string | null;
  due_date: string | null;
  created_at: string;
}

interface CaseUpdateRow {
  case_id: string;
  client_id: string;
  created_at: string;
  descricao_tecnica?: string | null;
}

interface MeetingTaskRow {
  id: string;
  meeting_minute_id: string;
  owner_id: string | null;
  due_date: string | null;
  status: string;
}

interface MeetingTaskListRow extends MeetingTaskRow {
  client_id: string | null;
  case_id: string | null;
  category_id: string | null;
  spotlight_item_id: string | null;
  title: string;
  description: string | null;
  source: string;
  created_at: string;
}

interface CategorySeed {
  category_key: string;
  title: string;
  items_count: number;
  items_json: Array<Record<string, unknown>>;
  decision_mode: "block" | "partial" | "individual" | "skip";
}

const staleDays = 60;
const recentUpdateDays = 30;
const upcomingDays = 14;

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function daysAgo(days: number) {
  return addDays(new Date(), -days).toISOString();
}

async function getProfileNames(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map<string, string>();

  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, nome")
    .in("id", uniqueIds);

  return new Map((data as ProfileName[] | null ?? []).map((p) => [p.id, p.nome]));
}

async function getResponsibleClientIds(responsavelId: string) {
  const supabase = await getSupabaseServerClient();

  const [{ data: assigned }, { data: owned }] = await Promise.all([
    supabase
      .from("lawyer_assignments")
      .select("client_id")
      .eq("advogado_id", responsavelId),
    supabase
      .from("clients")
      .select("id")
      .eq("responsavel_id", responsavelId)
      .eq("ativo", true),
  ]);

  return [
    ...new Set([
      ...((assigned ?? []) as Array<{ client_id: string }>).map((a) => a.client_id),
      ...((owned ?? []) as Array<{ id: string }>).map((c) => c.id),
    ]),
  ];
}

async function canCurrentUserUseResponsible(responsavelId: string) {
  const user = await getSessionUser();
  if (!user) return false;
  if (user.role === "admin" || user.role === "controller") return true;
  return user.role === "advogado" && user.id === responsavelId;
}

export async function listMeetingMinutes() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("meeting_minutes")
      .select(
        "id, responsavel_id, created_by, meeting_date, due_at, scope, participants, status, timebox_minutes, summary, published_at, created_at, updated_at",
      )
      .order("meeting_date", { ascending: false })
      .limit(100);

    if (error) return { success: false, error: error.message, data: [] };

    const rows = (data ?? []) as MeetingMinuteRow[];
    const names = await getProfileNames([
      ...rows.map((r) => r.responsavel_id),
      ...rows.map((r) => r.created_by || ""),
    ]);

    const minuteIds = rows.map((r) => r.id);
    let categoryCounts = new Map<string, number>();
    let taskCounts = new Map<string, number>();

    if (minuteIds.length > 0) {
      const [{ data: categories }, { data: tasks }] = await Promise.all([
        supabase
          .from("meeting_minute_categories")
          .select("meeting_minute_id")
          .in("meeting_minute_id", minuteIds),
        supabase
          .from("meeting_tasks")
          .select("meeting_minute_id")
          .in("meeting_minute_id", minuteIds),
      ]);

      categoryCounts = countByMinute(
        (categories ?? []) as Array<{ meeting_minute_id: string }>,
      );
      taskCounts = countByMinute((tasks ?? []) as Array<{ meeting_minute_id: string }>);
    }

    return {
      success: true,
      data: rows.map((row) => ({
        ...row,
        responsavel_nome: names.get(row.responsavel_id) || "Responsavel",
        created_by_nome: row.created_by ? names.get(row.created_by) || null : null,
        categories_count: categoryCounts.get(row.id) || 0,
        tasks_count: taskCounts.get(row.id) || 0,
      })),
    };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message, data: [] };
    return { success: false, error: "Erro ao listar atas", data: [] };
  }
}

export async function getMeetingMinute(id: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("meeting_minutes")
      .select(
        "id, responsavel_id, created_by, meeting_date, due_at, scope, participants, status, timebox_minutes, summary, published_at, created_at, updated_at, portfolio_snapshot_json, agenda_json, minutes_json",
      )
      .eq("id", id)
      .single();

    if (error) return { success: false, error: error.message, data: null };
    if (!data) return { success: false, error: "Ata nao encontrada", data: null };

    const row = data as MeetingMinuteRow & {
      portfolio_snapshot_json: Record<string, unknown>;
      agenda_json: Record<string, unknown>;
      minutes_json: Record<string, unknown>;
    };
    const names = await getProfileNames([row.responsavel_id, row.created_by || ""]);

    return {
      success: true,
      data: {
        ...row,
        responsavel_nome: names.get(row.responsavel_id) || "Responsavel",
        created_by_nome: row.created_by ? names.get(row.created_by) || null : null,
      },
    };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message, data: null };
    return { success: false, error: "Erro ao buscar ata", data: null };
  }
}

function countByMinute(rows: Array<{ meeting_minute_id: string }>) {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    counts.set(row.meeting_minute_id, (counts.get(row.meeting_minute_id) || 0) + 1);
  });
  return counts;
}

export async function createMeetingMinute(input: MeetingMinuteCreateInput) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: "Nao autenticado" };

    const validated = meetingMinuteCreateSchema.parse(input);
    if (!(await canCurrentUserUseResponsible(validated.responsavelId))) {
      return { success: false, error: "Acesso negado para este responsavel" };
    }

    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("meeting_minutes")
      .insert({
        responsavel_id: validated.responsavelId,
        created_by: user.id,
        meeting_date: validated.meetingDate,
        due_at: validated.dueAt || null,
        scope: validated.scope || null,
        participants: validated.participants,
        timebox_minutes: validated.timeboxMinutes,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/meeting-minutes");
    return { success: true, data };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message };
    return { success: false, error: "Erro ao criar ata" };
  }
}

export async function updateMeetingMinute(id: string, input: MeetingMinuteUpdateInput) {
  try {
    const validated = meetingMinuteUpdateSchema.parse(input);
    const supabase = await getSupabaseServerClient();

    const updateData: Record<string, unknown> = {};
    if (validated.meetingDate !== undefined) updateData.meeting_date = validated.meetingDate;
    if (validated.dueAt !== undefined) updateData.due_at = validated.dueAt || null;
    if (validated.scope !== undefined) updateData.scope = validated.scope || null;
    if (validated.participants !== undefined)
      updateData.participants = validated.participants;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.timeboxMinutes !== undefined)
      updateData.timebox_minutes = validated.timeboxMinutes;
    if (validated.portfolioSnapshot !== undefined)
      updateData.portfolio_snapshot_json = validated.portfolioSnapshot;
    if (validated.agenda !== undefined) updateData.agenda_json = validated.agenda;
    if (validated.minutes !== undefined) updateData.minutes_json = validated.minutes;
    if (validated.summary !== undefined) updateData.summary = validated.summary || null;
    if (validated.status === "published") updateData.published_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("meeting_minutes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/meeting-minutes");
    return { success: true, data };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message };
    return { success: false, error: "Erro ao atualizar ata" };
  }
}

export async function publishMeetingMinute(id: string) {
  return updateMeetingMinute(id, { status: "published" });
}

export async function prepareMeetingMinute(id: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: minute, error: minuteError } = await supabase
      .from("meeting_minutes")
      .select("*")
      .eq("id", id)
      .single();

    if (minuteError || !minute) {
      return { success: false, error: minuteError?.message || "Ata nao encontrada" };
    }

    const meetingMinute = minute as MeetingMinuteRow & {
      portfolio_snapshot_json: Record<string, unknown>;
    };

    const { snapshot, categories } = await buildPortfolioSnapshot(
      meetingMinute.responsavel_id,
    );

    const upsertRows = categories.map((category) => ({
      meeting_minute_id: id,
      category_key: category.category_key,
      title: category.title,
      items_count: category.items_count,
      items_json: category.items_json,
      decision_mode: category.decision_mode,
    }));

    const { error: upsertError } = await supabase
      .from("meeting_minute_categories")
      .upsert(upsertRows, {
        onConflict: "meeting_minute_id,category_key",
      });

    if (upsertError) return { success: false, error: upsertError.message };

    const { data, error } = await supabase
      .from("meeting_minutes")
      .update({
        status: "prepared",
        portfolio_snapshot_json: snapshot,
        agenda_json: {
          generatedAt: new Date().toISOString(),
          categoryKeys: categories.map((c) => c.category_key),
        },
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/meeting-minutes");
    return { success: true, data, categories };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message };
    return { success: false, error: "Erro ao preparar pauta" };
  }
}

async function buildPortfolioSnapshot(responsavelId: string) {
  const supabase = await getSupabaseServerClient();
  const today = new Date();
  const clientIds = await getResponsibleClientIds(responsavelId);

  let clients: ClientRow[] = [];
  let cases: CaseRow[] = [];
  let updates: CaseUpdateRow[] = [];
  let tasks: MeetingTaskRow[] = [];

  if (clientIds.length > 0) {
    const [clientsRes, casesRes, updatesRes, tasksRes] = await Promise.all([
      supabase
        .from("clients")
        .select("id, razao_social, responsavel_id")
        .in("id", clientIds)
        .eq("ativo", true),
      supabase
        .from("cases")
        .select("id, client_id, numero_processo, descricao, status, created_at")
        .in("client_id", clientIds)
        .not("status", "in", "(resolvido,arquivado)"),
      supabase
        .from("case_updates")
        .select("case_id, client_id, created_at, descricao_tecnica")
        .in("client_id", clientIds)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("meeting_tasks")
        .select("id, meeting_minute_id, owner_id, due_date, status")
        .eq("owner_id", responsavelId)
        .eq("status", "open"),
    ]);

    clients = (clientsRes.data ?? []) as ClientRow[];
    cases = (casesRes.data ?? []) as CaseRow[];
    updates = (updatesRes.data ?? []) as CaseUpdateRow[];
    tasks = (tasksRes.data ?? []) as MeetingTaskRow[];
  }

  const updatesByCase = new Map<string, CaseUpdateRow>();
  const updatesByClient = new Map<string, CaseUpdateRow>();
  updates.forEach((update) => {
    if (!updatesByCase.has(update.case_id)) updatesByCase.set(update.case_id, update);
    if (!updatesByClient.has(update.client_id)) {
      updatesByClient.set(update.client_id, update);
    }
  });

  const staleCutoff = new Date(daysAgo(staleDays));
  const clientRecentCutoff = new Date(daysAgo(recentUpdateDays));
  const upcomingLimit = isoDate(addDays(today, upcomingDays));
  const todayIso = isoDate(today);

  const staleCases = cases.filter((caseItem) => {
    const lastUpdate = updatesByCase.get(caseItem.id)?.created_at || caseItem.created_at;
    return new Date(lastUpdate) < staleCutoff;
  });

  const clientsWithoutRecentUpdate = clients.filter((client) => {
    const lastUpdate = updatesByClient.get(client.id)?.created_at;
    return !lastUpdate || new Date(lastUpdate) < clientRecentCutoff;
  });

  const overdueTasks = tasks.filter((task) => task.due_date && task.due_date < todayIso);
  const upcomingTasks = tasks.filter(
    (task) =>
      task.due_date && task.due_date >= todayIso && task.due_date <= upcomingLimit,
  );

  const categories: CategorySeed[] = [
    {
      category_key: "stale_cases_60d",
      title: "Processos sem movimentacao ha mais de 60 dias",
      items_count: staleCases.length,
      items_json: staleCases.slice(0, 50).map((caseItem) => ({
        caseId: caseItem.id,
        clientId: caseItem.client_id,
        numeroProcesso: caseItem.numero_processo,
        descricao: caseItem.descricao,
        status: caseItem.status,
        lastUpdateAt: updatesByCase.get(caseItem.id)?.created_at || caseItem.created_at,
      })),
      decision_mode: "block",
    },
    {
      category_key: "clients_without_recent_update",
      title: "Clientes sem comunicacao recente",
      items_count: clientsWithoutRecentUpdate.length,
      items_json: clientsWithoutRecentUpdate.slice(0, 50).map((client) => ({
        clientId: client.id,
        razaoSocial: client.razao_social,
        lastUpdateAt: updatesByClient.get(client.id)?.created_at || null,
      })),
      decision_mode: "block",
    },
    {
      category_key: "overdue_tasks",
      title: "Tarefas vencidas",
      items_count: overdueTasks.length,
      items_json: overdueTasks.slice(0, 50).map((task) => ({
        taskId: task.id,
        dueDate: task.due_date,
      })),
      decision_mode: "block",
    },
    {
      category_key: "upcoming_deadlines",
      title: "Tarefas e prazos dos proximos 14 dias",
      items_count: upcomingTasks.length,
      items_json: upcomingTasks.slice(0, 50).map((task) => ({
        taskId: task.id,
        dueDate: task.due_date,
      })),
      decision_mode: "block",
    },
  ];

  return {
    snapshot: {
      generatedAt: new Date().toISOString(),
      responsavelId,
      clientsCount: clients.length,
      activeCasesCount: cases.length,
      openTasksCount: tasks.length,
      staleCasesCount: staleCases.length,
      clientsWithoutRecentUpdateCount: clientsWithoutRecentUpdate.length,
    },
    categories,
  };
}

export async function listMeetingMinuteCategories(meetingMinuteId: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("meeting_minute_categories")
      .select("*")
      .eq("meeting_minute_id", meetingMinuteId)
      .order("created_at");

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: data || [] };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message, data: [] };
    return { success: false, error: "Erro ao listar categorias", data: [] };
  }
}

export async function updateMeetingMinuteCategory(
  id: string,
  input: MeetingMinuteCategoryUpdateInput,
) {
  try {
    const validated = meetingMinuteCategoryUpdateSchema.parse(input);
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("meeting_minute_categories")
      .update({
        decision_mode: validated.decisionMode,
        decision_text: validated.decisionText || null,
        owner_id: validated.ownerId || null,
        due_date: validated.dueDate || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/meeting-minutes");
    return { success: true, data };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message };
    return { success: false, error: "Erro ao atualizar categoria" };
  }
}

export async function createSpotlightItem(input: SpotlightItemCreateInput) {
  try {
    const validated = spotlightItemCreateSchema.parse(input);
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("meeting_minute_spotlight_items")
      .insert({
        meeting_minute_id: validated.meetingMinuteId,
        client_id: validated.clientId || null,
        case_id: validated.caseId || null,
        reason: validated.reason,
        discussion_notes: validated.discussionNotes || null,
        decision_text: validated.decisionText || null,
        owner_id: validated.ownerId || null,
        due_date: validated.dueDate || null,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/meeting-minutes");
    return { success: true, data };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message };
    return { success: false, error: "Erro ao criar caso destacado" };
  }
}

export async function listSpotlightItems(meetingMinuteId: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("meeting_minute_spotlight_items")
      .select("*")
      .eq("meeting_minute_id", meetingMinuteId)
      .order("created_at");

    if (error) return { success: false, error: error.message, data: [] };

    const rows = (data ?? []) as SpotlightItemRow[];
    const clientIds = rows.map((row) => row.client_id).filter(Boolean) as string[];
    const caseIds = rows.map((row) => row.case_id).filter(Boolean) as string[];
    const [clientsRes, casesRes] = await Promise.all([
      clientIds.length > 0
        ? supabase.from("clients").select("id, razao_social").in("id", clientIds)
        : Promise.resolve({ data: [] }),
      caseIds.length > 0
        ? supabase
            .from("cases")
            .select("id, numero_processo, descricao")
            .in("id", caseIds)
        : Promise.resolve({ data: [] }),
    ]);

    const clientsById = new Map(
      ((clientsRes.data ?? []) as Array<{ id: string; razao_social: string }>).map(
        (client) => [client.id, client],
      ),
    );
    const casesById = new Map(
      (
        (casesRes.data ?? []) as Array<{
          id: string;
          numero_processo: string;
          descricao: string | null;
        }>
      ).map((caseItem) => [caseItem.id, caseItem]),
    );

    return {
      success: true,
      data: rows.map((row) => {
        const client = row.client_id ? clientsById.get(row.client_id) : null;
        const caseItem = row.case_id ? casesById.get(row.case_id) : null;
        return {
          ...row,
          client_name: client?.razao_social || null,
          case_number: caseItem?.numero_processo || null,
          case_description: caseItem?.descricao || null,
        };
      }),
    };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message, data: [] };
    return { success: false, error: "Erro ao listar casos destacados", data: [] };
  }
}

export async function listSpotlightOptions(meetingMinuteId: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: minute, error: minuteError } = await supabase
      .from("meeting_minutes")
      .select("responsavel_id")
      .eq("id", meetingMinuteId)
      .single();

    if (minuteError || !minute) {
      return {
        success: false,
        error: minuteError?.message || "Ata nao encontrada",
        data: { clients: [], cases: [] },
      };
    }

    const clientIds = await getResponsibleClientIds(
      (minute as { responsavel_id: string }).responsavel_id,
    );

    if (clientIds.length === 0) {
      return { success: true, data: { clients: [], cases: [] } };
    }

    const [clientsRes, casesRes] = await Promise.all([
      supabase
        .from("clients")
        .select("id, razao_social")
        .in("id", clientIds)
        .eq("ativo", true)
        .order("razao_social"),
      supabase
        .from("cases")
        .select("id, client_id, numero_processo, descricao, status")
        .in("client_id", clientIds)
        .not("status", "in", "(resolvido,arquivado)")
        .order("numero_processo"),
    ]);

    if (clientsRes.error) {
      return {
        success: false,
        error: clientsRes.error.message,
        data: { clients: [], cases: [] },
      };
    }
    if (casesRes.error) {
      return {
        success: false,
        error: casesRes.error.message,
        data: { clients: clientsRes.data || [], cases: [] },
      };
    }

    return {
      success: true,
      data: {
        clients: clientsRes.data || [],
        cases: casesRes.data || [],
      },
    };
  } catch (err) {
    if (err instanceof Error) {
      return {
        success: false,
        error: err.message,
        data: { clients: [], cases: [] },
      };
    }
    return {
      success: false,
      error: "Erro ao listar opcoes de destaque",
      data: { clients: [], cases: [] },
    };
  }
}

export async function updateSpotlightItem(id: string, input: SpotlightItemUpdateInput) {
  try {
    const validated = spotlightItemUpdateSchema.parse(input);
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("meeting_minute_spotlight_items")
      .update({
        client_id: validated.clientId || null,
        case_id: validated.caseId || null,
        reason: validated.reason,
        discussion_notes: validated.discussionNotes || null,
        decision_text: validated.decisionText || null,
        owner_id: validated.ownerId || null,
        due_date: validated.dueDate || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/meeting-minutes");
    return { success: true, data };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message };
    return { success: false, error: "Erro ao atualizar caso destacado" };
  }
}

export async function listMeetingTasks(meetingMinuteId: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("meeting_tasks")
      .select("*")
      .eq("meeting_minute_id", meetingMinuteId)
      .order("created_at");

    if (error) return { success: false, error: error.message, data: [] };

    const rows = (data ?? []) as MeetingTaskListRow[];
    const ownerNames = await getProfileNames(rows.map((row) => row.owner_id || ""));
    const clientIds = rows.map((row) => row.client_id).filter(Boolean) as string[];
    const caseIds = rows.map((row) => row.case_id).filter(Boolean) as string[];
    const [clientsRes, casesRes] = await Promise.all([
      clientIds.length > 0
        ? supabase.from("clients").select("id, razao_social").in("id", clientIds)
        : Promise.resolve({ data: [] }),
      caseIds.length > 0
        ? supabase.from("cases").select("id, numero_processo").in("id", caseIds)
        : Promise.resolve({ data: [] }),
    ]);

    const clientsById = new Map(
      ((clientsRes.data ?? []) as Array<{ id: string; razao_social: string }>).map(
        (client) => [client.id, client.razao_social],
      ),
    );
    const casesById = new Map(
      ((casesRes.data ?? []) as Array<{ id: string; numero_processo: string }>).map(
        (caseItem) => [caseItem.id, caseItem.numero_processo],
      ),
    );

    return {
      success: true,
      data: rows.map((row) => ({
        ...row,
        owner_name: row.owner_id ? ownerNames.get(row.owner_id) || null : null,
        client_name: row.client_id ? clientsById.get(row.client_id) || null : null,
        case_number: row.case_id ? casesById.get(row.case_id) || null : null,
      })),
    };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message, data: [] };
    return { success: false, error: "Erro ao listar tarefas", data: [] };
  }
}

export async function createMeetingTask(input: MeetingTaskCreateInput) {
  try {
    const validated = meetingTaskCreateSchema.parse(input);
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("meeting_tasks")
      .insert({
        meeting_minute_id: validated.meetingMinuteId,
        client_id: validated.clientId || null,
        case_id: validated.caseId || null,
        category_id: validated.categoryId || null,
        spotlight_item_id: validated.spotlightItemId || null,
        title: validated.title,
        description: validated.description || null,
        owner_id: validated.ownerId || null,
        due_date: validated.dueDate || null,
        source: validated.source,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/meeting-minutes");
    return { success: true, data };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message };
    return { success: false, error: "Erro ao criar tarefa" };
  }
}

export async function updateMeetingTask(id: string, input: MeetingTaskUpdateInput) {
  try {
    const validated = meetingTaskUpdateSchema.parse(input);
    const supabase = await getSupabaseServerClient();

    const updateData: Record<string, unknown> = {};
    if (validated.clientId !== undefined) updateData.client_id = validated.clientId || null;
    if (validated.caseId !== undefined) updateData.case_id = validated.caseId || null;
    if (validated.categoryId !== undefined)
      updateData.category_id = validated.categoryId || null;
    if (validated.spotlightItemId !== undefined)
      updateData.spotlight_item_id = validated.spotlightItemId || null;
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined)
      updateData.description = validated.description || null;
    if (validated.ownerId !== undefined) updateData.owner_id = validated.ownerId || null;
    if (validated.dueDate !== undefined) updateData.due_date = validated.dueDate || null;
    if (validated.source !== undefined) updateData.source = validated.source;
    if (validated.status !== undefined) {
      updateData.status = validated.status;
      updateData.completed_at =
        validated.status === "done" ? new Date().toISOString() : null;
    }

    const { data, error } = await supabase
      .from("meeting_tasks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/meeting-minutes");
    return { success: true, data };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message };
    return { success: false, error: "Erro ao atualizar tarefa" };
  }
}
