# Roadmap — FFADV Dashboard

Marcos sequenciais até o v1. Cada feature segue o ciclo do skill `tlc-spec-driven`: Specify → (Design se Large) → Tasks → Execute, com commits atômicos e gate de testes.

## Marco 1 — Fundação técnica

- **01-foundation** (`Medium`) — scaffold Next.js 15 + TS strict, Tailwind, shadcn/ui, ESLint/Prettier, Drizzle, Supabase clients, Vitest + Playwright, GitHub Actions CI, tokens de marca (paleta gradiente placeholder).

## Marco 2 — Identidade e acesso

- **02-auth-rbac** (`Large`) — Supabase Auth (e-mail/senha + magic link), tabelas `profiles` e `lawyer_assignments`, enum `role`, RLS policies por papel, helper `lib/auth/rbac.ts`, middleware de proteção de rotas (`(internal)` vs `(client)`), página de login, callback OAuth, primeiro consentimento LGPD do cliente.

## Marco 3 — Dados-mestre

- **03-clients-users** (`Large`) — CRUD de `clients` (incluindo `kpi_visibility` jsonb), CRUD de `profiles` internos (somente Admin), atribuição advogado↔cliente, fluxo de convite por e-mail (Supabase Auth invite), página de gestão de usuários.

## Marco 4 — Operação financeira

- **04-cases-financials** (`Large`) — CRUD de `cases` (com `valor_pleiteado_contra`, `valor_condenado_contra`, `valor_condenacao_favoravel`, `valor_acordo_recebido`), CRUD de `case_costs` e `case_receipts`, validação Zod compartilhada client/server, escrita em `audit_log`, RLS respeitando `lawyer_assignments`.

## Marco 5 — Visibilidade

- **05-dashboard-internal** (`Large`) — `lib/db/queries/kpis.ts` (fonte única dos cálculos), página `(internal)/dashboard` com cards KPI + gráficos (Recharts), filtros por cliente e período (mês/trimestre/ano), respeitando papel: Admin/Controller veem todos os clientes, Advogado vê só os atribuídos.
- **06-client-portal** (`Medium`) — route group `(client)/portal` somente leitura: dashboard com KPIs respeitando `kpi_visibility`, lista de processos do próprio cliente.

## Marco 6 — Comprovação para o cliente

- **07-pdf-report** (`Medium`) — `app/api/reports/[clientId]/pdf/route.ts` com `@react-pdf/renderer`: capa com logo + período, KPIs, lista de processos, gráficos estáticos; reusa `lib/db/queries/kpis.ts`; respeita RBAC e `kpi_visibility`.

## Definition of Done v1

Critérios consolidados em `PROJECT.md` (seção Goals + Scope) e detalhados em cada `spec.md`. Release somente quando todos os marcos estiverem com CI verde, e2e por papel passando, e smoke manual no preview Vercel concluído.

## Pós-v1 (deferred — manter em STATE.md)

- Notificações por e-mail (lançamento de novo processo, fechamento de mês).
- Tela de auditoria para Admin.
- Importação de planilhas (CSV/XLSX) como fonte alternativa de lançamentos.
- Integração DataJud/CNJ para enriquecer status processual.
- Multi-idioma (EN) e multi-moeda.
- Chat/tickets cliente↔escritório.
