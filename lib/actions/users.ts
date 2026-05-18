"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { translateError } from "@/lib/utils/errors";
import {
  userCreateSchema,
  userUpdateSchema,
  type UserCreateInput,
  type UserUpdateInput,
} from "@/lib/validators/user";

export async function createUser(input: UserCreateInput) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const validated = userCreateSchema.parse(input);
    const tempPassword = Math.random().toString(36).slice(-10) + "Aa1!";

    // Usa o admin client (service role) para criar usuário no Auth
    const adminClient = getSupabaseAdminClient();
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: validated.email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError) return { error: translateError(authError.message) };
    if (!authData?.user?.id) return { error: "Erro ao criar usuário" };

    const { data: profileData, error: profileError } = await adminClient
      .from("profiles")
      .insert({
        id: authData.user.id,
        nome: validated.nome,
        role: validated.role,
        client_id: validated.clientId || null,
        ativo: true,
      })
      .select()
      .single();

    if (profileError) {
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return { error: translateError(profileError.message) };
    }

    revalidatePath("/admin/users");
    return {
      success: true,
      data: profileData,
      tempPassword,
      message: `Usuário criado com sucesso.`,
    };
  } catch (err) {
    if (err instanceof Error) return { error: translateError(err.message) };
    return { error: "Erro ao criar usuário" };
  }
}

export async function updateUser(id: string, input: UserUpdateInput) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const validated = userUpdateSchema.parse(input);

    const updateData: Record<string, unknown> = {};
    if (validated.nome) updateData.nome = validated.nome;
    if (validated.role) updateData.role = validated.role;
    if (validated.ativo !== undefined) updateData.ativo = validated.ativo;

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/admin/users");
    return { success: true, data };
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    return { error: "Erro ao atualizar usuário" };
  }
}

export async function toggleUserActive(id: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const { data: current } = await supabase
      .from("profiles")
      .select("ativo")
      .eq("id", id)
      .single();

    if (!current) return { error: "Usuário não encontrado" };

    const { data, error } = await supabase
      .from("profiles")
      .update({ ativo: !current.ativo })
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/admin/users");
    return { success: true, data };
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    return { error: "Erro ao alternar status do usuário" };
  }
}

export async function listUsers(
  page: number = 1,
  pageSize: number = 20,
  roleFilter?: string,
) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado", success: false, data: [] };

    let query = supabase
      .from("profiles")
      .select("id, nome, role, ativo, created_at", { count: "exact" })
      .neq("role", "cliente")
      .order("created_at", { ascending: false });

    if (roleFilter && roleFilter !== "all") {
      query = query.eq("role", roleFilter);
    }

    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) return { error: error.message, success: false, data: [] };

    return {
      success: true,
      data: data || [],
      pagination: {
        page, pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  } catch (err) {
    if (err instanceof Error) return { error: err.message, success: false, data: [] };
    return { error: "Erro ao buscar usuários", success: false, data: [] };
  }
}

export async function listAssignableUsers() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const { data, error } = await supabase
      .from("profiles")
      .select("id, nome, role")
      .in("role", ["advogado", "controller"])
      .eq("ativo", true)
      .order("nome");

    if (error) return { error: error.message };
    return { success: true, data: data || [] };
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    return { error: "Erro ao buscar usuários" };
  }
}
