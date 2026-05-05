import { z } from "zod";

/**
 * Enum de roles — sincronizado com RLS no Postgres
 */
export const roleEnum = z.enum(["admin", "controller", "advogado", "cliente"]);
export type Role = z.infer<typeof roleEnum>;

/**
 * Validador para criar novo usuário
 */
export const userCreateSchema = z.object({
  email: z
    .string()
    .email("E-mail inválido")
    .max(255, "E-mail muito longo"),
  nome: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(255, "Nome muito longo"),
  role: roleEnum,
  clientId: z
    .string()
    .uuid("ID do cliente deve ser um UUID válido")
    .optional()
    .nullable(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;

/**
 * Validador para atualizar usuário
 */
export const userUpdateSchema = z.object({
  nome: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(255, "Nome muito longo")
    .optional(),
  role: roleEnum.optional(),
  ativo: z.boolean().optional(),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

/**
 * Validador para atribuição advogado ↔ cliente
 */
export const assignmentSchema = z.object({
  advogadoId: z
    .string()
    .uuid("ID do advogado deve ser um UUID válido"),
  clientId: z
    .string()
    .uuid("ID do cliente deve ser um UUID válido"),
});

export type AssignmentInput = z.infer<typeof assignmentSchema>;
