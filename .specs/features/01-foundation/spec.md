# Feature 01 — Foundation

**Size:** Medium • **Depends on:** —

## Why

Antes de qualquer feature de produto, o repositório precisa de um esqueleto técnico padronizado: Next.js 15 com TS strict, estilo (Tailwind + shadcn/ui + tokens de marca), camada de dados (Drizzle + Supabase clients), testes (Vitest + Playwright) e CI. Sem isso, todas as features seguintes carregariam decisões ad-hoc.

## Requirements

- **R1** — `package.json` com Next.js 15, React 19, TypeScript 5.x strict, scripts `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `db:generate`, `db:push`.
- **R2** — `tsconfig.json` com `strict: true`, `noUncheckedIndexedAccess: true`, paths `@/*`.
- **R3** — Tailwind CSS configurado, `app/globals.css` com CSS variables de marca (`--brand-50…900`, `--brand-gradient`, `--accent-gradient`) usando paleta provisória `#0F3D60 → #2DA0C8`.
- **R4** — shadcn/ui inicializado (`components.json`), com primitivos `button`, `card`, `input`, `label`, `dialog`, `dropdown-menu`, `table`, `select`.
- **R5** — Cliente Supabase: `lib/supabase/server.ts` (cookies, anon key, edge-safe), `lib/supabase/admin.ts` (service_role, server-only). `.env.example` lista `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`.
- **R6** — Drizzle: `drizzle.config.ts` aponta para `lib/db/schema.ts` (vazio com export `pgSchema` placeholder), output `supabase/migrations/`.
- **R7** — Vitest configurado (`vitest.config.ts`) com ambiente `node`, alias `@`. Um teste sentinela `tests/unit/sanity.test.ts` passa.
- **R8** — Playwright configurado (`playwright.config.ts`) apontando para `http://localhost:3000`. Um teste sentinela `tests/e2e/sanity.spec.ts` carrega `/` e valida título.
- **R9** — ESLint (Next + TS) e Prettier configurados; `pnpm lint` passa em verde no scaffold.
- **R10** — `.github/workflows/ci.yml` executa, em Node 20, sequencialmente: `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`. (E2E rodará só pós-feature 02 quando houver app real.)
- **R11** — `public/brand/.gitkeep` reservado; `README.md` com instruções de setup local (clonar, copiar `.env.example`, `pnpm install`, `pnpm dev`).
- **R12** — `app/page.tsx` exibe placeholder com `BrandHeader` simples e título "FFADV Dashboard" usando o degradê de marca (validação visual de que tokens estão aplicados).

## Out of scope

- Login funcional (fica em 02-auth-rbac).
- Schema real de banco (tabelas reais virão em 02 e 03).
- Logo definitiva — usar texto até o usuário fornecer SVG.

## Verification

1. `pnpm install` sem erros.
2. `pnpm typecheck` — sem erros em strict.
3. `pnpm lint` — verde.
4. `pnpm test` — sanity test passa.
5. `pnpm dev` — `http://localhost:3000` mostra header com logo-texto FFADV em degradê azul-marinho → azul-oceano.
6. `pnpm build` — verde.
7. `pnpm test:e2e` — sanity carrega `/` e encontra título.
8. CI no GitHub: workflow verde no primeiro push.

## Traceability

| ID  | File(s) |
|---|---|
| R1  | `package.json` |
| R2  | `tsconfig.json` |
| R3  | `tailwind.config.ts`, `app/globals.css` |
| R4  | `components.json`, `components/ui/*` |
| R5  | `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `.env.example` |
| R6  | `drizzle.config.ts`, `lib/db/schema.ts` |
| R7  | `vitest.config.ts`, `tests/unit/sanity.test.ts` |
| R8  | `playwright.config.ts`, `tests/e2e/sanity.spec.ts` |
| R9  | `.eslintrc.json`, `.prettierrc` |
| R10 | `.github/workflows/ci.yml` |
| R11 | `public/brand/.gitkeep`, `README.md` |
| R12 | `app/page.tsx`, `components/brand/BrandHeader.tsx` |
