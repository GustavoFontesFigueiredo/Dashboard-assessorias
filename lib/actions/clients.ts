"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  clientCreateSchema,
  clientUpdateSchema,
  type ClientCreateInput,
  type ClientUpdateInput,
} from "@/lib/validators/client";

export async function createClient(input: ClientCreateInput) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const validated = clientCreateSchema.parse(input);

    const { data, error } = await supabase
      .from("clients")
      .insert({
        razao_social: validated.razaoSocial,
        cnpj: validated.cnpj || null,
        responsavel_id: validated.responsavelId || null,
        kpi_visibility: validated.kpiVisibility || {
          custos: true, evitadas: true, recebidos: true, roi: true,
        },
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return { error: "CNPJ já existe no sistema" };
      return { error: error.message };
    }

    revalidatePath("/admin/clients");
    return { success: true, data };
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    return { error: "Erro ao criar cliente" };
  }
}

export async function updateClient(id: string, input: ClientUpdateInput) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const validated = clientUpdateSchema.parse(input);

    const updateData: Record<string, unknown> = {};
    if (validated.razaoSocial) updateData.razao_social = validated.razaoSocial;
    if (validated.cnpj !== undefined) updateData.cnpj = validated.cnpj || null;
    if (validated.responsavelId !== undefined)
      updateData.responsavel_id = validated.responsavelId || null;
    if (validated.kpiVisibility) updateData.kpi_visibility = validated.kpiVisibility;
    if (validated.ativo !== undefined) updateData.ativo = validated.ativo;

    const { data, error } = await supabase
      .from("clients")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return { error: "CNPJ já existe no sistema" };
      return { error: error.message };
    }

    revalidatePath("/admin/clients");
    return { success: true, data };
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    return { error: "Erro ao atualizar cliente" };
  }
}

export async function deleteClient(id: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const { error } = await supabase
      .from("clients")
      .update({ ativo: false })
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/clients");
    return { success: true };
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    return { error: "Erro ao deletar cliente" };
  }
}

export async function listClients(
  page: number = 1,
  pageSize: number = 20,
  search?: string,
) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    let query = supabase
      .from("clients")
      .select(
        "id, razao_social, cnpj, responsavel_id, ativo, kpi_visibility, created_at",
        { count: "exact" },
      )
      .eq("ativo", true)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `razao_social.ilike.%${search}%,cnpj.ilike.%${search}%`,
      );
    }

    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) return { error: error.message };

    return {
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    return { error: "Erro ao buscar clientes" };
  }
}
