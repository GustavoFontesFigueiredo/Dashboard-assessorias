import { z } from "zod";

export const meetingStatusSchema = z.enum([
  "draft",
  "prepared",
  "in_progress",
  "completed",
  "published",
  "cancelled",
]);

export const meetingMinuteCreateSchema = z.object({
  responsavelId: z.string().uuid("Responsavel invalido"),
  meetingDate: z.string().min(1, "Data da reuniao e obrigatoria"),
  dueAt: z.string().optional().nullable(),
  scope: z.string().max(120, "Escopo muito longo").optional().nullable(),
  participants: z.array(z.string().min(1)).default([]),
  timeboxMinutes: z.coerce.number().int().min(30).max(50).default(40),
});

export const meetingMinuteUpdateSchema = z.object({
  meetingDate: z.string().min(1).optional(),
  dueAt: z.string().optional().nullable(),
  scope: z.string().max(120).optional().nullable(),
  participants: z.array(z.string().min(1)).optional(),
  status: meetingStatusSchema.optional(),
  timeboxMinutes: z.coerce.number().int().min(30).max(50).optional(),
  portfolioSnapshot: z.record(z.unknown()).optional(),
  agenda: z.record(z.unknown()).optional(),
  minutes: z.record(z.unknown()).optional(),
  summary: z.string().max(4000).optional().nullable(),
});

export const meetingMinuteCategoryUpdateSchema = z.object({
  decisionMode: z.enum(["block", "partial", "individual", "skip"]).optional(),
  decisionText: z.string().max(2000).optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const spotlightItemCreateSchema = z.object({
  meetingMinuteId: z.string().uuid(),
  clientId: z.string().uuid().optional().nullable(),
  caseId: z.string().uuid().optional().nullable(),
  reason: z.string().min(3, "Informe o motivo").max(1000),
  discussionNotes: z.string().max(4000).optional().nullable(),
  decisionText: z.string().max(2000).optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const spotlightItemUpdateSchema = spotlightItemCreateSchema
  .omit({ meetingMinuteId: true })
  .partial();

export const meetingTaskCreateSchema = z.object({
  meetingMinuteId: z.string().uuid(),
  clientId: z.string().uuid().optional().nullable(),
  caseId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  spotlightItemId: z.string().uuid().optional().nullable(),
  title: z.string().min(3, "Titulo e obrigatorio").max(255),
  description: z.string().max(2000).optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  source: z
    .enum(["manual", "block_decision", "spotlight_decision", "future_transcription_ai"])
    .default("manual"),
});

export const meetingTaskUpdateSchema = meetingTaskCreateSchema
  .omit({ meetingMinuteId: true })
  .partial()
  .extend({
    status: z.enum(["open", "done", "cancelled"]).optional(),
  });

export type MeetingMinuteCreateInput = z.infer<typeof meetingMinuteCreateSchema>;
export type MeetingMinuteUpdateInput = z.infer<typeof meetingMinuteUpdateSchema>;
export type MeetingMinuteCategoryUpdateInput = z.infer<
  typeof meetingMinuteCategoryUpdateSchema
>;
export type SpotlightItemCreateInput = z.infer<typeof spotlightItemCreateSchema>;
export type SpotlightItemUpdateInput = z.infer<typeof spotlightItemUpdateSchema>;
export type MeetingTaskCreateInput = z.infer<typeof meetingTaskCreateSchema>;
export type MeetingTaskUpdateInput = z.infer<typeof meetingTaskUpdateSchema>;
