# FFADV Assessorias — Dashboard Jurídico

**Vision:** Plataforma web que demonstra, de forma transparente, o valor financeiro da assessoria jurídica prestada pela FFADV a empresas-cliente — custos contratados, condenações evitadas e valores recebidos — com visões diferenciadas por papel.
**For:** Sócios e equipe da FFADV (Admin, Controller, Advogado) e clientes corporativos do escritório.
**Solves:** Hoje a comprovação de retorno da assessoria depende de planilhas e relatórios manuais; o cliente não tem visibilidade contínua dos próprios números, e a equipe não tem um painel único para acompanhar carteira, custos e resultados.

## Goals

- **Transparência cliente:** ≥ 90% dos clientes ativos com login no portal e acesso autônomo aos próprios KPIs em até 60 dias após go-live.
- **Eficiência interna:** reduzir em ≥ 70% o tempo de produção do relatório mensal por cliente (hoje ~2h em planilha → < 30 min via app + PDF).
- **Isolamento de dados:** zero incidentes de exposição cruzada de dados entre clientes (medido por testes e2e + revisão de logs).
- **Adoção:** 100% dos lançamentos financeiros de novos processos feitos no app dentro de 90 dias após go-live.

## Tech Stack

**Core:**

- Framework: Next.js 15 (App Router) + React 19
- Language: TypeScript 5.x (strict)
- Database: PostgreSQL via Supabase (managed) — Auth + RLS

**Key dependencies:**

- Drizzle ORM (schema + migrations tipadas)
- shadcn/ui + Tailwind CSS (UI)
- Recharts (gráficos)
- React Hook Form + Zod (forms/validação)
- @react-pdf/renderer (relatório PDF)
- Vitest + Playwright (testes)

## Scope

**v1 includes:**

- Autenticação Supabase (e-mail/senha + magic link) e RBAC com 4 papéis: Admin, Controller, Advogado, Cliente.
- Cadastro manual de clientes, processos, custos e recebimentos.
- Atribuição de advogados a clientes (N:N) limitando a visibilidade dos dados.
- Dashboard interno (Admin/Controller/Advogado) com KPIs: custos, condenações evitadas, valores recebidos, ROI — filtros por cliente e período.
- Toggle por cliente, definido pelo Admin/Controller, controlando quais KPIs e quais lançamentos (custos/recebimentos) ficam visíveis no portal do cliente.
- Portal do cliente (somente leitura): dashboard próprio + lista de processos + download de relatório PDF do período.
- Identidade visual com logo do escritório e paleta em degradê derivada da logo, aplicada na UI e no PDF.
- Localização PT-BR + BRL (datas, moeda, CNPJ).
- CI (GitHub Actions): typecheck + lint + unit + e2e + build.

**Explicitly out of scope:**

- Integração com tribunais ou DataJud/CNJ.
- Notificações por e-mail ou SMS.
- Auditoria detalhada com UI (apenas `audit_log` mínimo gravado, sem tela).
- Multi-idioma (apenas PT-BR no v1).
- Faturamento/cobrança automática.
- Chat / abertura de tickets pelo cliente.
- App mobile nativo (apenas web responsivo).

## Constraints

- **Hospedagem:** Vercel (frontend/edge) + Supabase managed (DB/Auth/Storage). Free tier suficiente para piloto.
- **LGPD:** dados de processos podem conter informação sensível de terceiros — coleta minimizada, finalidade documentada, consentimento do cliente externo no primeiro login.
- **Segurança:** isolamento de dados implementado em duas camadas — RLS no Postgres + checagem na aplicação (defesa em profundidade); `service_role` apenas em rotas server-side administrativas.
- **Equipe:** desenvolvimento individual com IA assistida; manter superfície técnica enxuta (sem microsserviços, sem fila externa, sem cache distribuído no v1).
