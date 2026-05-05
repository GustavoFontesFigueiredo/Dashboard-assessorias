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
 * clients — empresas-cliente (criada aqui para referência, detalhes em 03-clients-users)
 */
export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    razaoSocial: text("razao_social").notNull(),
    cnpj: text("cnpj"),
    ativo: boolean("ativo").default(true),
    kpiVisibility: jsonb("kpi_visibility").default(
      sql`'{"custos": true, "evitadas": true, "recebidos": true, "roi": true}'`,
    ),
    criadoEm: timestamp("created_at").default(sql`now()`),
  },
  (table) => ({
    cnpjIdx: index("idx_clients_cnpj").on(table.cnpj),
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
