import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  pgEnum,
  uniqueIndex,
  index,
  jsonb,
  date,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Enum de papéis — sincronizado com RLS policies
 */
export const roleEnum = pgEnum("role", [
  "admin",
  "controller",
  "advogado",
  "cliente",
]);

export const nextStepStatusEnum = pgEnum("next_step_status", [
  "pendente",
  "em_andamento",
  "aguardando_cliente",
  "concluido",
  "cancelado",
]);

/**
 * profiles — espelha auth.users, adiciona role, client_id e dados do perfil
 */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().references(() => auth.users.id, {
      onDelete: "cascade",
    }),
    role: roleEnum("role").notNull(),
    clientId: uuid("client_id"),
    nome: text("nome").notNull(),
    ativo: boolean("ativo").default(true),
    criadoEm: timestamp("created_at").default(sql`now()`),
  },
  (table) => ({
    clientIdIdx: index("idx_profiles_client_id").on(table.clientId),
  }),
);

/**
 * lawyer_assignments — N:N entre advogados internos e clientes
 * Define quais clientes cada advogado pode acessar
 */
export const lawyerAssignments = pgTable(
  "lawyer_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    advogadoId: uuid("advogado_id").notNull(),
    clientId: uuid("client_id").notNull(),
    criadoEm: timestamp("created_at").default(sql`now()`),
  },
  (table) => ({
    advogadoClientUnique: uniqueIndex("uq_lawyer_assignments").on(
      table.advogadoId,
      table.clientId,
    ),
    advogadoIdx: index("idx_lawyer_assignments_advogado").on(
      table.advogadoId,
    ),
    clientIdx: index("idx_lawyer_assignments_client").on(table.clientId),
  }),
);

/**
 * clients — empresas-cliente
 */
export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    razaoSocial: text("razao_social").notNull(),
    cnpj: text("cnpj").unique(),
    responsavelId: uuid("responsavel_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    ativo: boolean("ativo").default(true),
    kpiVisibility: jsonb("kpi_visibility").default(
      sql`'{"custos": true, "evitadas": true, "recebidos": true, "roi": true}'::jsonb`,
    ),
    criadoEm: timestamp("created_at").default(sql`now()`),
  },
  (table) => ({
    cnpjIdx: index("idx_clients_cnpj").on(table.cnpj),
    responsavelIdx: index("idx_clients_responsavel").on(table.responsavelId),
  }),
);

/**
 * client_next_steps — próximos passos publicados no portal do cliente.
 * A FK de case_id é mantida no SQL manual porque `cases` ainda não está
 * sincronizada neste schema Drizzle.
 */
export const clientNextSteps = pgTable(
  "client_next_steps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    caseId: uuid("case_id"),
    title: text("title").notNull(),
    description: text("description"),
    ownerId: uuid("owner_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    dueDate: date("due_date"),
    status: nextStepStatusEnum("status").notNull().default("pendente"),
    visibleToClient: boolean("visible_to_client").notNull().default(true),
    sourceUpdateId: uuid("source_update_id"),
    createdBy: uuid("created_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    criadoEm: timestamp("created_at").default(sql`now()`),
    atualizadoEm: timestamp("updated_at").default(sql`now()`),
  },
  (table) => ({
    clientStatusDueIdx: index("idx_client_next_steps_client").on(
      table.clientId,
      table.status,
      table.dueDate,
    ),
    caseIdx: index("idx_client_next_steps_case").on(table.caseId),
    ownerIdx: index("idx_client_next_steps_owner").on(table.ownerId),
  }),
);

/**
 * Referência à tabela auth.users do Supabase (não gerenciada por Drizzle)
 */
export const auth = {
  users: pgTable("users", {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    encryptedPassword: text("encrypted_password"),
    createdAt: timestamp("created_at"),
  }),
};
