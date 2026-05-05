"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/rbac";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  userCreateSchema,
  userUpdateSchema,
  type UserCreateInput,
  type UserUpdateInput,
} from "@/lib/validators/user";

/**
 * Cria novo usuário (apenas Admin)
 * Cria auth.user + profile
 */
export async function createUser(input: UserCreateInput) {
  try {
    const user = await getSessionUser();
    if (user?.role !== "admin") {
      return { error: "Apenas administradores podem criar usuários" };
    }

    // Valida input
    const validated = userCreateSchema.parse(input);

    const supabase = await getSupabaseServerClient();

    // 1. Criar auth.user com senha aleatória (Admin define depois)
    // Obs: em produção, enviar email com link de reset de senha
    const tempPassword = Math.random().toString(36).slice(-12);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser(
      {
        email: validated.email,
        password: tempPassword,
        email_confirm: true,
      },
    );

    if (authError) {
      if (authError.message.includes("already exists")) {
        return { error: "Este e-mail já está registrado no sistema" };
      }
      return { error: authError.message };
    }

    if (!authData?.user?.id) {
      return { error: "Erro ao criar usuário no auth" };
    }

    // 2. Criar perfil
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        email: validated.email,
        nome: validated.nome,
        role: validated.role,
        client_id: validated.clientId || null,
        ativo: true,
      })
      .select()
      .single();

    if (profileError) {
      // Rollback: deletar auth.user se profile falhar
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { error: profileError.message };
    }

    revalidatePath("/internal/admin/users");
    return {
      success: true,
      data: profileData,
      message:
        "Usuário criado. Uma senha temporária foi gerada. Comunique ao usuário para fazer login e alterar a senha.",
    };
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "Erro ao criar usuário" };
  }
}

/**
 * Atualiza perfil de usuário (apenas Admin)
 */
export async function updateUser(
  id: string,
  input: UserUpdateInput,
) {
  try {
    const user = await getSessionUser();
    if (user?.role !== "admin") {
      return { error: "Apenas administradores podem editar usuários" };
    }

    // Valida input
    const validated = userUpdateSchema.parse(input);

    const supabase = await getSupabaseServerClient();

    // Prepara update
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

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/internal/admin/users");
    return { success: true, data };
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "Erro ao atualizar usuário" };
  }
}

/**
 * Ativa/desativa usuário (apenas Admin)
 */
export async function toggleUserActive(id: string) {
  try {
    const user = await getSessionUser();
    if (user?.role !== "admin") {
      return { error: "Apenas administradores podem ativar/desativar usuários" };
    }

    const supabase = await getSupabaseServerClient();

    // Busca status atual
    const { data: current } = await supabase
      .from("profiles")
      .select("ativo")
      .eq("id", id)
      .single();

    if (!current) {
      return { error: "Usuário não encontrado" };
    }

    // Toggle
    const { data, error } = await supabase
      .from("profiles")
      .update({ ativo: !current.ativo })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/internal/admin/users");
    return { success: true, data };
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "Erro ao alternar status do usuário" };
  }
}

/**
 * Lista usuários internos (exceto clientes)
 */
export async function listUsers(
  page: number = 1,
  pageSize: number = 20,
  roleFilter?: string,
) {
  try {
    const user = await getSessionUser();
    if (user?.role !== "admin") {
      return { error: "Acesso negado" };
    }

    const supabase = await getSupabaseServerClient();

    let query = supabase
      .from("profiles")
      .select("id, nome, role, ativo, created_at", { count: "exact" })
      .neq("role", "cliente")
      .order("created_at", { ascending: false });

    // Filtro por role
    if (roleFilter && roleFilter !== "all") {
      query = query.eq("role", roleFilter);
    }

    // Paginação
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      return { error: error.message };
    }

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
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "Erro ao buscar usuários" };
  }
}

/**
 * Busca usuários disponíveis para atribuição (advogados e controllers)
 */
export async function listAssignableUsers() {
  try {
    const user = await getSessionUser();
    if (user?.role !== "admin") {
      return { error: "Acesso negado" };
    }

    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, nome, role")
      .in("role", ["advogado", "controller"])
      .eq("ativo", true)
      .order("nome");

    if (error) {
      return { error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "Erro ao buscar usuários" };
  }
}
