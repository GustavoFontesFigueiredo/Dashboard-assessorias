# STATE — FFADV Dashboard

Memória persistente entre sessões: decisões, blockers, lições, todos e ideias adiadas.

## Decisions

- **2026-04-30** — Stack confirmada: Next.js 15 + TypeScript + Supabase (Postgres + Auth + RLS), hospedagem Vercel + Supabase managed.
- **2026-04-30** — Origem dos dados no v1: cadastro manual no app. Sem integração com tribunais.
- **2026-04-30** — Cargos internos: Admin, Controller (= Advogado + Financeiro consolidados), Advogado.
- **2026-04-30** — Cliente externo (portal) terá dashboard, lista de processos e download de PDF.
- **2026-04-30** — KPIs: custos, condenações evitadas, valores recebidos, ROI; visibilidade no portal cliente é toggável por cliente, definida por Admin/Controller.
- **2026-04-30** — Localização: PT-BR + BRL apenas no v1.
- **2026-05-01** — Logo recebida: águia em silhueta preta, tipografia serif "FONTES FIGUEIREDO / ADVOGADOS". Paleta atualizada: charcoal (#090C14 → #1C2133) + dourado (#C9963A) como acento. Brand gradient = charcoal escuro. Accent gradient = dourado para KPI de ROI e destaques.
- **2026-05-01** — Nome oficial: "Fontes Figueiredo Advogados". Sigla "FFADV" mantida nos identificadores técnicos (nome do repo, etc.).
- **2026-05-04** — Logo SVG integrada: `logo.svg` (completa com texto), `logo-mark.svg` (apenas águia para favicon/header), `logo-mono.svg` (monocromática para impressão). BrandMark carrega o SVG com fallback "FF".

## Blockers

- _(nenhum)_ — Logo SVG integrada em produção.

## Lessons

- _(vazio — registrar surpresas técnicas e decisões revertidas conforme surgirem)_

## Todos (cross-feature)

- Configurar projeto Supabase de dev e copiar URL/keys para `.env.local` (manual — credenciais não vão para o repo).
- Configurar projeto Vercel com variáveis de ambiente (manual).
- Definir e cadastrar primeiro Admin (seed ou via Supabase dashboard) antes do go-live.
- Validar paleta final com sócio quando logo chegar.

## Deferred (pós-v1)

- Notificações por e-mail.
- Tela de auditoria.
- Importação CSV/XLSX.
- Integração DataJud/CNJ.
- i18n EN.
- Chat cliente↔escritório.

## Preferences

- _(vazio — registrar preferências do usuário ao longo das sessões)_
