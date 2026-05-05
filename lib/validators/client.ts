import { z } from "zod";

/**
 * Validador para criação/atualização de cliente
 * CNPJ: formato apenas (XX.XXX.XXX/0001-XX)
 */
export const clientSchema = z.object({
  razaoSocial: z
    .string()
    .min(3, "Razão social deve ter no mínimo 3 caracteres")
    .max(255, "Razão social muito longa"),
  cnpj: z
    .string()
    .regex(
      /^\d{2}\.\d{3}\.\d{3}\/0001-\d{2}$/,
      "CNPJ deve estar no formato XX.XXX.XXX/0001-XX",
    )
    .optional()
    .or(z.literal("")),
  responsavelId: z
    .string()
    .uuid("ID do responsável deve ser um UUID válido")
    .optional()
    .nullable(),
  kpiVisibility: z
    .object({
      custos: z.boolean(),
      evitadas: z.boolean(),
      recebidos: z.boolean(),
      roi: z.boolean(),
    })
    .optional(),
  ativo: z.boolean().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;

/**
 * Validador para atualização de cliente (todos campos opcionais)
 */
export const clientUpdateSchema = clientSchema.partial();
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>;

/**
 * Validador para criação de cliente (razaoSocial obrigatório)
 */
export const clientCreateSchema = clientSchema.pick({
  razaoSocial: true,
  cnpj: true,
  responsavelId: true,
  kpiVisibility: true,
});

export type ClientCreateInput = z.infer<typeof clientCreateSchema>;
