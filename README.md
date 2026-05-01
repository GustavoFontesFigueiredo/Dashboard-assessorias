# FFADV Dashboard

Plataforma web da FFADV Assessorias para acompanhamento financeiro da assessoria jurídica prestada a empresas-cliente — custos, condenações evitadas, valores recebidos e ROI — com visões diferenciadas por papel (Admin, Controller, Advogado, Cliente).

> Planejamento detalhado em [`.specs/project/PROJECT.md`](.specs/project/PROJECT.md) e [`.specs/project/ROADMAP.md`](.specs/project/ROADMAP.md). Cada feature tem seu próprio `spec.md` em `.specs/features/`.

## Stack

- **Next.js 15** (App Router) + **TypeScript** strict
- **Supabase** (Postgres + Auth + RLS)
- **Drizzle ORM** para schema/migrações
- **Tailwind CSS** + **shadcn/ui** + paleta de marca em degradê
- **Recharts** (gráficos), **@react-pdf/renderer** (relatórios)
- **Vitest** (unit) + **Playwright** (e2e)
- **Vercel** (hosting) + **GitHub Actions** (CI)

## Setup local

```bash
pnpm install
cp .env.example .env.local      # preencha com as chaves do projeto Supabase
pnpm dev                        # http://localhost:3000
```

### Scripts

| Comando            | Descrição                                |
| ------------------ | ---------------------------------------- |
| `pnpm dev`         | Servidor de desenvolvimento              |
| `pnpm build`       | Build de produção                        |
| `pnpm typecheck`   | Verifica TypeScript em modo strict       |
| `pnpm lint`        | Lint Next/ESLint                         |
| `pnpm test`        | Testes unitários (Vitest)                |
| `pnpm test:e2e`    | Testes end-to-end (Playwright)           |
| `pnpm db:generate` | Gera SQL de migration (Drizzle)          |
| `pnpm db:push`     | Aplica schema atual no banco             |
| `pnpm format`      | Formata o código (Prettier + Tailwind)   |

## Identidade visual

A paleta de marca está em `app/globals.css` (`--brand-50` … `--brand-900`, `--brand-gradient`, `--accent-gradient`) e exposta no Tailwind via `bg-brand-gradient`, `text-brand-700`, etc.

A logo definitiva ainda **não foi fornecida**. Coloque os arquivos em `public/brand/` (`logo.svg`, `logo-mark.svg`, `logo-mono.svg`) e atualize as cores em `app/globals.css` para casar com a logo. Até lá usa-se um placeholder em texto + a paleta provisória `#0F3D60 → #2DA0C8`.

## Estrutura

```
app/                  # Rotas Next.js (App Router)
components/
  brand/              # BrandHeader, KpiCard, GradientBadge
  ui/                 # Componentes shadcn (instalar via `pnpm dlx shadcn@latest add ...`)
  charts/             # Wrappers Recharts
lib/
  db/                 # Schema Drizzle + queries
  supabase/           # server.ts (anon) + admin.ts (service_role)
  formatters.ts       # BRL, datas, CNPJ
  utils.ts            # cn()
public/brand/         # Logo + favicons
supabase/migrations/  # Migrations geradas pelo Drizzle
tests/
  unit/               # Vitest
  e2e/                # Playwright
.specs/               # Documentação spec-driven (PROJECT, ROADMAP, STATE, features)
```

## Próximos passos

1. Instalar componentes shadcn iniciais: `pnpm dlx shadcn@latest add button card input label dialog dropdown-menu table select`.
2. Criar projeto Supabase, copiar URL/keys para `.env.local`.
3. Iniciar feature `02-auth-rbac` (ver `.specs/features/02-auth-rbac/spec.md` quando criada).
