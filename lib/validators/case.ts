import { z } from "zod";

export const caseCreateSchema = z.object({
  client_id: z.string().uuid("ID do cliente inválido"),
  numero_processo: z
    .string()
    .min(3, "Número do processo é obrigatório")
    .max(50, "Número do processo muito longo"),
  descricao: z
    .string()
    .min(5, "Descrição é obrigatória")
    .max(1000, "Descrição muito longa")
    .optional(),
  fase: z.enum(["conhecimento", "recurso", "execucao", "encerrado"], {
    errorMap: () => ({ message: "Fase inválida" }),
  }),
  status: z.enum(
    ["em_andamento", "suspenso", "resolvido", "arquivado"],
    {
      errorMap: () => ({ message: "Status inválido" }),
    }
  ),
  valor_pleiteado_contra: z
    .number()
    .nonnegative("Valor não pode ser negativo")
    .optional()
    .default(0),
  valor_condenado_contra: z
    .number()
    .nonnegative("Valor não pode ser negativo")
    .optional()
    .default(0),
  valor_condenacao_favoravel: z
    .number()
    .nonnegative("Valor não pode ser negativo")
    .optional()
    .default(0),
  valor_acordo_recebido: z
    .number()
    .nonnegative("Valor não pode ser negativo")
    .optional()
    .default(0),
  advogado_responsavel_id: z.string().uuid("ID do advogado inválido").optional(),
});

export const caseUpdateSchema = caseCreateSchema.partial().extend({
  client_id: z.string().uuid().optional(),
});

export type CaseCreateInput = z.infer<typeof caseCreateSchema>;
export type CaseUpdateInput = z.infer<typeof caseUpdateSchema>;

export const caseCostSchema = z.object({
  case_id: z.string().uuid("ID do processo inválido").optional(),
  client_id: z.string().uuid("ID do cliente inválido"),
  tipo: z.enum(["honorario_fixo", "honorario_variavel", "custas", "outro"], {
    errorMap: () => ({ message: "Tipo de custo inválido" }),
  }),
  descricao: z
    .string()
    .min(3, "Descrição é obrigatória")
    .max(500, "Descrição muito longa"),
  valor: z
    .number()
    .positive("Valor deve ser positivo"),
  data_competencia: z.coerce.date(),
});

export type CaseCostInput = z.infer<typeof caseCostSchema>;

export const caseReceiptSchema = z.object({
  case_id: z.string().uuid("ID do processo inválido"),
  client_id: z.string().uuid("ID do cliente inválido"),
  descricao: z
    .string()
    .min(3, "Descrição é obrigatória")
    .max(500, "Descrição muito longa"),
  valor: z
    .number()
    .positive("Valor deve ser positivo"),
  data: z.coerce.date(),
});

export type CaseReceiptInput = z.infer<typeof caseReceiptSchema>;
