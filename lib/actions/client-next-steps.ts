"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { translateError } from "@/lib/utils/errors";
import {
  clientNextStepSchema,
  clientNextStepUpdateSchema,
  type ClientNextStepInput,
  type ClientNextStepUpdateInput,
} from "@/lib/validators/client-next-step";

type Relation<T> = T | T[] | null | undefined;

function firstRelation<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation ?? null;
}

interface NextStepRow {
  id: string;
  client_id: string;
  case_id: string | null;
  title: string;
  description: string | null;
  owner_id: string | null;
  due_date: string | null;
  status: string;
  visible_to_client: boolean;
  created_at: string;
  updated_at: string;
  cases?: Relation<{ numero_processo: string | null }>;
  profiles?: Relation<{ nome: string | null }>;
}

function mapStep(row: NextStepRow) {
  const caseInfo = firstRelation(row.cases);
  const owner = firstRelation(row.profiles);

  return {
    ...row,
    case_number: caseInfo?.numero_processo || null,
    owner_name: owner?.nome || null,
  };
}

function normalizePayload(
  input: ClientNextStepInput | ClientNextStepUpdateInput,
  userId?: string,
) {
  const payload: Record<string, unknown> = {};

  if (input.clientId !== undefined) payload.client_id = input.clientId;
  if (input.caseId !== undefined) payload.case_id = input.caseId || null;
  if (input.title !== undefined) payload.title = input.title;
  if (input.description !== undefined) {
    payload.description = input.description?.trim() || null;
  }
  if (input.ownerId !== undefined) payload.owner_id = input.ownerId || null;
  if (input.dueDate !== undefined) payload.due_date = input.dueDate || null;
  if (input.status !== undefined) payload.status = input.status;
  if (input.visibleToClient !== undefined) {
    payload.visible_to_client = input.visibleToClient;
  }
  if (userId) payload.created_by = userId;

  return payload;
}

export async function createClientNextStep(input: ClientNextStepInput) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const validated = clientNextStepSchema.parse(input);
    const { data, error } = await supabase
      .from("client_next_steps")
      .insert(normalizePayload(validated, user.id))
      .select("*, cases(numero_processo), profiles:owner_id(nome)")
      .single();

    if (error) return { success: false, error: translateError(error.message) };

    revalidatePath("/portal");
    revalidatePath("/admin/next-steps");
    return { success: true, data: mapStep(data as unknown as NextStepRow) };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: translateError(err.message) };
    }
    return { success: false, error: "Erro ao criar próximo passo" };
  }
}

export async function updateClientNextStep(
  id: string,
  input: ClientNextStepUpdateInput,
) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const validated = clientNextStepUpdateSchema.parse(input);
    const { data, error } = await supabase
      .from("client_next_steps")
      .update(normalizePayload(validated))
      .eq("id", id)
      .select("*, cases(numero_processo), profiles:owner_id(nome)")
      .single();

    if (error) return { success: false, error: translateError(error.message) };

    revalidatePath("/portal");
    revalidatePath("/admin/next-steps");
    return { success: true, data: mapStep(data as unknown as NextStepRow) };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: translateError(err.message) };
    }
    return { success: false, error: "Erro ao atualizar próximo passo" };
  }
}

export async function cancelClientNextStep(id: string) {
  return updateClientNextStep(id, {
    status: "cancelado",
    visibleToClient: false,
  });
}

export async function listClientNextSteps(clientId: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Não autenticado", data: [] };
    }

    const { data, error } = await supabase
      .from("client_next_steps")
      .select("*, cases(numero_processo), profiles:owner_id(nome)")
      .eq("client_id", clientId)
      .order("status", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: translateError(error.message), data: [] };
    }

    return {
      success: true,
      data: ((data || []) as unknown as NextStepRow[]).map(mapStep),
    };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: translateError(err.message), data: [] };
    }
    return { success: false, error: "Erro ao listar próximos passos", data: [] };
  }
}
