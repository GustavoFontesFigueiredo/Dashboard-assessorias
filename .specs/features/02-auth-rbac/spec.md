# Feature 02 — Auth + RBAC

**Size:** Large • **Depends on:** 01-foundation

## Why

Sem autenticação e controle de acesso baseado em papel, o app não consegue segregar dados entre usuários. Esta feature implementa o núcleo de segurança: login Supabase (e-mail/senha + magic link), tabelas `profiles` e `lawyer_assignments`, RLS policies no Postgres e middleware de proteção de rotas. Cada usuário logado saberá seu papel (Admin, Controller, Advogado, Cliente) e verá apenas o que lhe é permitido.

## Requirements

- **R1** — Schema Drizzle: tabelas `profiles`, `lawyer_assignments` com RLS habilitada. `profiles` espelha `auth.users` e inclui `role` (enum), `client_id` (FK para tabela `clients` — futura), `nome`, `ativo`. `lawyer_assignments` mapeia N:N advogados ↔ clientes.
- **R2** — Supabase Auth: autenticação por e-mail/senha nativa + suporte a magic link (verificação por link). Callback OAuth/confirmação automática configurada em `app/(auth)/auth/callback/route.ts`.
- **R3** — RLS Policies: políticas no Postgres por papel — `profiles` e `lawyer_assignments` são acessíveis de acordo com `(select role from profiles where id = auth.uid())`.
- **R4** — Helper `lib/auth/rbac.ts`: funções `getSessionUser()`, `canAccessClient(userId, clientId)`, `canEditCase(userId, caseId)`, `hasRole(userId, role)`.
- **R5** — Middleware `lib/middleware.ts`: redireciona `/` → `/login` se não autenticado; `/login` → `/dashboard` se já logado; `/client/*` → `/login` se não-cliente; `/internal/*` → `/login` se não-interno.
- **R6** — Route group `app/(auth)/` com página `login/page.tsx`: form e-mail/senha com validação Zod, link para magic link, callback handler.
- **R7** — Route group `app/(internal)/` (protegido, apenas internos): placeholder dashboard/root.
- **R8** — Route group `app/(client)/` (protegido, apenas clientes): placeholder portal/root.
- **R9** — Primeiro admin seed: script `supabase/seed.sql` cria 1 admin inicial (hardcoded ou via ENV para testes).
- **R10** — Testes e2e: Playwright valida fluxos:
  - Anônimo → `/login` → e-mail/senha → `/dashboard` (role interno)
  - Anônimo → `/login` → magic link → confirmação → `/dashboard`
  - Cliente logado tenta `/internal/dashboard` → redirecionado para `/client/portal`
  - Advogado A tenta ver dados sem atribuição → acesso negado (RLS)

## Out of scope

- Recuperação de senha / reset (implementar em 2-3).
- Gestão de usuários (CRUD profiles) — fica em 03-clients-users.
- Convite por e-mail — fica em 03-clients-users.
- Logout / sessão (implementar em dashboard).

## Architecture

**Fluxo de autenticação:**
1. Usuário entra em `/` → middleware detecta ausência de sessão → redireciona para `/login`.
2. Em `/login`, escolhe e-mail/senha ou magic link.
3. Supabase Auth autentica e armazena `session.user.id` em cookies (SSR).
4. `getSupabaseServerClient()` automática lê a sessão dos cookies.
5. Route protegida (ex: `/internal/dashboard`) checa `getSessionUser()` → se nulo, redireciona `/login`.
6. Quando o usuário está autenticado, RLS no Postgres força isolamento de dados (défesa em profundidade).

**Tabelas:**
```sql
-- profiles (espelha auth.users)
create table profiles (
  id uuid primary key references auth.users,
  role text not null check (role in ('admin', 'controller', 'advogado', 'cliente')),
  client_id uuid,
  nome text not null,
  ativo boolean default true,
  created_at timestamp default now()
);

-- lawyer_assignments (N:N advogado ↔ cliente)
create table lawyer_assignments (
  id uuid primary key default gen_random_uuid(),
  advogado_id uuid not null references profiles,
  client_id uuid not null,
  created_at timestamp default now(),
  unique (advogado_id, client_id)
);
```

## Verification

1. `pnpm typecheck` — sem erros.
2. `pnpm lint` — verde.
3. `pnpm test` — unit tests de RBAC helpers.
4. `pnpm build` — sucesso.
5. `pnpm test:e2e`:
   - Login com e-mail/senha → redireciona para `/internal/dashboard` (admin).
   - Magic link → confirmação → acesso ao portal.
   - Cliente tenta `/internal/*` → 403 ou redirecionamento.
   - Advogado sem atribuição tenta ver cliente — `canAccessClient()` retorna false.

## Traceability

| ID  | File(s) |
|---|---|
| R1  | `lib/db/schema.ts` (Drizzle), `supabase/migrations/0002_auth_rbac.sql` |
| R2  | `app/(auth)/login/page.tsx`, `app/(auth)/auth/callback/route.ts`, Supabase Auth settings |
| R3  | `supabase/migrations/0002_auth_rbac.sql` (RLS policies) |
| R4  | `lib/auth/rbac.ts` |
| R5  | `lib/middleware.ts` |
| R6  | `app/(auth)/login/page.tsx`, `app/(auth)/auth/callback/route.ts` |
| R7  | `app/(internal)/dashboard/page.tsx` (placeholder) |
| R8  | `app/(client)/portal/page.tsx` (placeholder) |
| R9  | `supabase/seed.sql` |
| R10 | `tests/e2e/auth-flow.spec.ts`, `tests/e2e/rbac-isolation.spec.ts` |
