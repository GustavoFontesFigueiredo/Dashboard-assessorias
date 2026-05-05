# Feature 03 — Clients & Users Management

**Size:** Large • **Depends on:** 02-auth-rbac

## Why

O app precisa de um painel administrativo onde o Admin possa gerenciar a base de clientes (empresas-cliente), criar e editar usuários internos (advogados, controllers), e atribuir advogados a clientes. Esta feature implementa o CRUD completo com validações e auditoria básica.

## Requirements

- **R1** — Tabela `clients` (já existe no schema 02, agora com CRUD): `id`, `razao_social`, `cnpj`, `ativo`, `kpi_visibility` (JSON com flags de quais KPIs cada cliente pode ver), `created_at`. Atualizar schema para incluir `responsavel_id` (FK para o advogado principal).
- **R2** — Páginas Admin sob `/internal/admin/`:
  - `/internal/admin/clients` — lista, busca, criar/editar cliente (modal ou página)
  - `/internal/admin/users` — lista de usuários, criar/editar (modal), ativar/desativar
  - `/internal/admin/assignments` — matriz N:N advogado ↔ cliente, drag-and-drop ou checkboxes
- **R3** — Forms com validação Zod: `razao_social` (required), `cnpj` (CNPJ válido + único), `kpi_visibility` (checkboxes), `responsavel_id` (select de advogados).
- **R4** — CRUD via Server Actions (`lib/actions/clients.ts`, `lib/actions/users.ts`, `lib/actions/assignments.ts`):
  - `createClient(data)`, `updateClient(id, data)`, `deleteClient(id)` (soft delete via `ativo=false`)
  - `createUser(email, nome, role)`, `updateUser(id, data)`, `toggleUserActive(id)`
  - `assignLawyer(advogadoId, clientId)`, `unassignLawyer(advogadoId, clientId)`
  - Cada ação valida permissões (só Admin) e retorna erros estruturados
- **R5** — Componentes reutilizáveis:
  - `AdminHeader` (breadcrumb, título)
  - `DataTable` genérico com sorting/paginação (reutilizável em todas as listas)
  - `ClientForm`, `UserForm`, `AssignmentMatrix`
  - `ConfirmDelete` modal
- **R6** — Toast notifications via Sonner para sucesso/erro de ações
- **R7** — Auditoria básica: tabela `audit_logs` com `action`, `table_name`, `record_id`, `old_values`, `new_values`, `user_id`, `timestamp`. Triggers SQL no Postgres preenchem automaticamente para `clients` e `profiles`.
- **R8** — Validações:
  - CNPJ único (check na DB)
  - E-mail único (check na DB via auth.users)
  - Não permitir deletar último admin
  - Não permitir deletar cliente com casos abertos (status != 'finalizado')
- **R9** — Paginação: lista de clientes com 20 itens/página, search por razão social/CNPJ
- **R10** — Testes:
  - Unit: validadores Zod
  - E2e: criar cliente, editar, listar, atribuir advogados

## Out of scope

- Importação em massa de clientes (CSV/XLSX) — fica em 07-data-import
- Relatórios de auditoria — fica em 08-advanced
- Soft delete com recover — apenas soft delete sem UI de recover

## Architecture

**Fluxo CRUD:**
1. Usuário Admin acessa `/internal/admin/clients`
2. Vê tabela com todos os clientes (ativos)
3. Clica "Novo Cliente" → modal abre `ClientForm`
4. Preenche form, clica "Salvar" → Server Action `createClient(data)` validada com Zod
5. Server Action checa permissões (RBAC), insere em DB
6. Toast notifica sucesso/erro, lista atualiza via cache revalidation
7. Admin pode editar cliente diretamente na linha (inline edit) ou via modal
8. Soft delete marcando `ativo=false`

**Atribuições:**
- Matriz visual: linhas = advogados, colunas = clientes
- Checkbox para cada célula
- Ao marcar/desmarcar, Server Action `assignLawyer()` / `unassignLawyer()`

**Auditoria:**
- Trigger SQL `audit_trigger_clients` cria log em `audit_logs` sempre que `clients` muda
- Trigger similar para `profiles`

## Verification

1. `pnpm typecheck` — sem erros.
2. `pnpm lint` — verde.
3. `pnpm test` — unit tests de validadores Zod.
4. `pnpm build` — sucesso.
5. `pnpm test:e2e`:
   - Admin loga → acessa `/internal/admin/clients`
   - Cria novo cliente (CNPJ válido, razão social única)
   - Lista mostra novo cliente
   - Atualiza cliente
   - Tenta criar cliente com CNPJ duplicado → erro
   - Atribui advogado A ao cliente
   - Desatribui advogado A
   - Audit log registra operações

## Traceability

| ID  | File(s) |
|---|---|
| R1  | `lib/db/schema.ts` (atualizar clients com responsavel_id), `supabase/migrations/0003_audit.sql` |
| R2  | `app/(internal)/admin/clients/page.tsx`, `app/(internal)/admin/users/page.tsx`, `app/(internal)/admin/assignments/page.tsx` |
| R3  | `lib/validators/client.ts`, `lib/validators/user.ts` |
| R4  | `lib/actions/clients.ts`, `lib/actions/users.ts`, `lib/actions/assignments.ts` |
| R5  | `components/admin/AdminHeader.tsx`, `components/admin/DataTable.tsx`, `components/admin/ClientForm.tsx`, `components/admin/UserForm.tsx`, `components/admin/AssignmentMatrix.tsx` |
| R6  | Sonner instalado via `pnpm add sonner`, usado em pages |
| R7  | `supabase/migrations/0003_audit.sql` (audit_logs table + triggers) |
| R8  | Validadores Zod em R3 + queries no getters |
| R9  | `components/admin/DataTable.tsx` (pagination logic) |
| R10 | `tests/unit/validators.test.ts`, `tests/e2e/admin-crud.spec.ts` |
