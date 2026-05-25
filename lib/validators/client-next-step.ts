import { z } from "zod";

export const nextStepStatusEnum = z.enum([
  "pendente",
  "em_andamento",
  "aguardando_cliente",
  "concluido",
  "cancelado",
]);

export const clientNextStepSchema = z.object({
  clientId: z.string().uuid("Cliente inválido"),
  caseId: z.string().uuid("Processo inválido").optional().nullable(),
  title: z
    .string()
    .min(3, "Título é obrigatório")
    .max(180, "Título muito longo"),
  description: z
    .string()
    .max(1000, "Descrição muito longa")
    .optional()
    .nullable(),
  ownerId: z.string().uuid("Responsável inválido").optional().nullable(),
  dueDate: z.string().optional().nullable(),
  status: nextStepStatusEnum.default("pendente"),
  visibleToClient: z.boolean().default(true),
});

export const clientNextStepUpdateSchema = clientNextStepSchema.partial().extend({
  clientId: z.string().uuid("Cliente inválido").optional(),
});

export type ClientNextStepInput = z.infer<typeof clientNextStepSchema>;
export type ClientNextStepUpdateInput = z.infer<typeof clientNextStepUpdateSchema>;
