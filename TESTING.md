# Guia de Testes — FFADV Assessorias

## Visão Geral

O projeto inclui testes em duas camadas:
- **Unit Tests**: Lógica de cálculo de KPIs (Vitest)
- **E2E Tests**: Fluxos de usuários por papel (Playwright)

---

## Setup de Testes

### Instalar dependências
```bash
pnpm install
```

Dependências já incluídas:
- `vitest` — Unit tests
- `@playwright/test` — E2E tests
- `@vitest/coverage-v8` — Code coverage

---

## Unit Tests (Vitest)

### Rodando testes
```bash
# Todos os testes unit
pnpm test

# Watch mode (rerun on file change)
pnpm test --watch

# Com coverage
pnpm test --coverage

# Teste específico
pnpm test kpis
```

### Arquivo: `tests/unit/kpis.test.ts`

Testes para cálculos de KPI:

#### `calculateCustos`
- ✅ Retorna 0 quando sem custos
- ✅ Soma múltiplos custos
- ✅ Lida com valores nulos

#### `calculateCondenacoes`
- ✅ Calcula condenações evitadas corretamente
- ✅ Retorna 0 quando condenação > pleiteado
- ✅ Retorna 0 quando sem casos

#### `calculateValoresRecebidos`
- ✅ Soma recebimentos + condenações favoráveis
- ✅ Retorna 0 quando sem dados

#### `calculateROI`
- ✅ Calcula ROI quando custos > 0
- ✅ Retorna Infinity quando custos = 0 mas há ganhos
- ✅ Retorna 0 quando custos = 0 e sem ganhos

#### Edge Cases
- ✅ Valores negativos
- ✅ Números muito grandes
- ✅ Decimais
- ✅ Arrays vazios

### Estrutura dos testes
```typescript
describe("KPI Calculations", () => {
  it("should...", async () => {
    // Arrange: setup
    // Act: execute
    // Assert: verify
  });
});
```

---

## E2E Tests (Playwright)

### Rodando testes
```bash
# Todos os E2E
pnpm test:e2e

# Watch mode
pnpm test:e2e --watch

# Teste específico
pnpm test:e2e admin

# Debug mode (abre Playwright Inspector)
pnpm test:e2e --debug

# Gera report HTML
pnpm test:e2e && pnpm exec playwright show-report
```

### Arquivo: `tests/e2e/main-flows.spec.ts`

Testes de fluxos reais por papel:

#### Admin Workflow
- ✅ Criar cliente
- ✅ Atribuir advogado a cliente
- ✅ Criar usuário com role
- ✅ Visualizar todos clientes no dashboard
- ✅ Fazer download de PDF

#### Lawyer Workflow
- ✅ Ver apenas clientes atribuídos
- ✅ Criar processo
- ✅ Adicionar custos
- ✅ Registrar recebimentos
- ✅ Visualizar KPIs
- ✅ Acesso negado a clientes não-atribuídos

#### Client Portal Workflow
- ✅ Login e ver dashboard próprio
- ✅ Respeitar kpi_visibility
- ✅ Visualizar processos próprios
- ✅ Download de PDF próprio
- ✅ Sem acesso a páginas admin

#### RBAC Security
- ✅ Advogado não acessa clientes de outro advogado
- ✅ Cliente não acessa dados de outro cliente
- ✅ Cliente não acessa admin
- ✅ Validação de dados (CNPJ, campos obrigatórios)

### Estrutura dos testes
```typescript
test("should do something", async ({ page, context }) => {
  // Login
  await login(page, email, password);
  
  // Navigate
  await page.click("text=Menu Item");
  await expect(page).toHaveURL("expected-url");
  
  // Interact
  await page.fill("input", "value");
  await page.click("button");
  
  // Assert
  await expect(page.locator("text=Expected")).toBeVisible();
});
```

---

## Pre-requisitos para E2E

### 1. Servidor rodando
```bash
# Terminal 1
pnpm dev
```

O servidor precisa estar em http://localhost:3000

### 2. Banco de dados
```bash
pnpm db:push
pnpm db:seed
```

Cria schema + dados demo (usuários de teste)

### 3. Usuários de teste no banco
```sql
-- Admin
INSERT INTO profiles (id, role, nome, ativo) VALUES
  ('admin-id', 'admin', 'Admin User', true);

-- Lawyer
INSERT INTO profiles (id, role, nome, ativo, client_id) VALUES
  ('lawyer-id', 'advogado', 'Lawyer', true, NULL);

-- Client
INSERT INTO profiles (id, role, nome, ativo, client_id) VALUES
  ('client-id', 'cliente', 'Client User', true, 'client-1-id');
```

---

## Estrutura de Testes

```
tests/
  unit/
    kpis.test.ts          ← Cálculos de KPI
  e2e/
    main-flows.spec.ts    ← Fluxos por papel
```

---

## Coverage

### Objetivo de coverage
- **Lines**: 50%
- **Functions**: 50%
- **Branches**: 50%
- **Statements**: 50%

### Gerar relatório
```bash
pnpm test --coverage
```

Abre em: `coverage/index.html`

---

## CI/CD Integration

### GitHub Actions
Tests rodam automaticamente em:
- Push para branches
- Pull requests

Config: `.github/workflows/ci.yml`

```yaml
- name: Run unit tests
  run: pnpm test

- name: Run E2E tests
  run: pnpm test:e2e
```

---

## Debugging

### Unit Tests
```bash
# Com logs
pnpm test --reporter=verbose

# Pare em debugger
it("test", async () => {
  debugger; // node --inspect-brk
  // ...
});
```

### E2E Tests
```bash
# Modo debug (abre Inspector)
pnpm test:e2e --debug

# Gera trace
await page.context().tracing.start({ ... });

# Vê screenshots/vídeos
ls test-results/
```

---

## Manutenção

### Quando adicionar testes

1. **Nova feature** → Unit test (se lógica) + E2E test (fluxo)
2. **Bug fix** → Unit test que falha antes, passa depois
3. **RBAC changes** → Teste de segurança em E2E

### Atualizar testes

```bash
# Regenerar snapshots
pnpm test -- --update

# Registrar novas traces
pnpm test:e2e --update-snapshots
```

---

## Troubleshooting

### "Port 3000 already in use"
```bash
# Matar processo
npx kill-port 3000
pnpm test:e2e
```

### "Timeout waiting for element"
- Aumentar timeout: `{ timeout: 10000 }`
- Verificar seletor está correto
- Verificar elemento existe no DOM

### "CORS error in E2E"
- Ensure server e testes usam mesma URL (localhost:3000)
- Check `.env.local` tem variáveis certas

### "Test flaky (passa às vezes)"
- Adicionar `await page.waitForTimeout(500)`
- Esperar elemento: `await page.waitForSelector("text=...")`
- Usar `waitForURL` em vez de setTimeout

---

## Exemplo Completo: Adicionar Novo Teste

### 1. Unit Test
```typescript
// tests/unit/my-feature.test.ts
import { describe, it, expect } from "vitest";
import { myFunction } from "@/lib/my-function";

describe("MyFeature", () => {
  it("should do something", () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

### 2. E2E Test
```typescript
// tests/e2e/my-feature.spec.ts
import { test, expect } from "@playwright/test";

test("should complete feature workflow", async ({ page }) => {
  await page.goto("http://localhost:3000/my-feature");
  await page.click("button");
  await expect(page.locator("text=Success")).toBeVisible();
});
```

### 3. Rodas testes
```bash
pnpm test                  # Unit
pnpm test:e2e              # E2E
pnpm test --coverage       # Coverage
```

---

## Resources

- [Vitest Docs](https://vitest.dev)
- [Playwright Docs](https://playwright.dev)
- [Testing Best Practices](https://testing-library.com/docs/guiding-principles)

---

**Testes são parte crítica da qualidade do software. Sempre escreva testes para novas features!**
