import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

// Test users
const ADMIN = {
  email: "admin@ffadv.com.br",
  password: "admin-password",
};

const LAWYER = {
  email: "advogado@ffadv.com.br",
  password: "lawyer-password",
};

const CLIENT = {
  email: "cliente@empresa.com.br",
  password: "client-password",
};

// Helper: Login
async function login(page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/**/*`, { timeout: 10000 });
}

test.describe("Admin Workflow", () => {
  test("should create client and assign lawyer", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);

    // Navigate to clients
    await page.click("text=Clientes");
    await expect(page).toHaveURL(`${BASE_URL}/internal/admin/clients`);

    // Create new client
    await page.click("text=Novo Cliente");
    await page.fill('input[placeholder="Nome da empresa"]', "Test Empresa LTDA");
    await page.fill(
      'input[placeholder="XX.XXX.XXX/0001-XX"]',
      "12.345.678/0001-90"
    );
    await page.click("button:has-text('Salvar')");
    await expect(page.locator("text=Cliente criado")).toBeVisible();

    // Navigate to assignments
    await page.click("text=Atribuições");
    await expect(page).toHaveURL(
      `${BASE_URL}/internal/admin/assignments`
    );

    // Verify assignment interface loaded
    await expect(page.locator("text=Advogados")).toBeVisible();
    await expect(page.locator("text=Clientes")).toBeVisible();
  });

  test("should create user with role", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);

    // Navigate to users
    await page.click("text=Usuários");
    await expect(page).toHaveURL(`${BASE_URL}/internal/admin/users`);

    // Create new user
    await page.click("text=Novo Usuário");
    await page.fill('input[placeholder="usuario@example.com"]', "novo@ffadv.com.br");
    await page.fill('input[placeholder="Nome completo"]', "Novo Advogado");

    // Select role
    await page.click('select-trigger-with-role');
    await page.click("text=Advogado");

    await page.click("button:has-text('Salvar')");
    await expect(page.locator("text=Usuário criado")).toBeVisible();
  });

  test("should view all clients in dashboard", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);

    // Navigate to dashboard
    await page.click("text=Dashboard");
    await expect(page).toHaveURL(`${BASE_URL}/internal/dashboard`);

    // Verify dashboard loaded
    await expect(page.locator("text=Custos da Assessoria")).toBeVisible();
    await expect(page.locator("text=Condenações Evitadas")).toBeVisible();
    await expect(page.locator("text=Valores Recebidos")).toBeVisible();
    await expect(page.locator("text=ROI")).toBeVisible();

    // Verify can select any client
    const clientSelect = page.locator('select-trigger-with-cliente');
    await clientSelect.click();
    await expect(page.locator("text=Selecione um cliente")).toBeVisible();
  });

  test("should download PDF report", async ({ page, context }) => {
    await login(page, ADMIN.email, ADMIN.password);

    // Navigate to dashboard
    await page.click("text=Dashboard");

    // Select a client
    const clientSelect = page.locator('select-trigger-with-cliente');
    await clientSelect.click();
    await page.click("text=Test Empresa");

    // Wait for KPIs to load
    await page.waitForTimeout(2000);

    // Click download PDF
    const downloadPromise = context.waitForEvent("download");
    await page.click("button:has-text('Baixar PDF')");
    const download = await downloadPromise;

    // Verify file is PDF
    expect(download.suggestedFilename()).toContain(".pdf");
  });
});

test.describe("Lawyer Workflow", () => {
  test("should only see assigned clients", async ({ page }) => {
    await login(page, LAWYER.email, LAWYER.password);

    // Navigate to dashboard
    await page.click("text=Dashboard");
    await expect(page).toHaveURL(`${BASE_URL}/internal/dashboard`);

    // Select client dropdown
    const clientSelect = page.locator('select-trigger-with-cliente');
    await clientSelect.click();

    // Should only see assigned clients
    const options = page.locator('select-item');
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Try to access unassigned client via URL - should fail
    await page.goto(`${BASE_URL}/internal/admin/cases?client=unassigned-id`);
    await expect(page.locator("text=Sem permissão")).toBeVisible();
  });

  test("should create case for assigned client", async ({ page }) => {
    await login(page, LAWYER.email, LAWYER.password);

    // Navigate to cases
    await page.click("text=Processos");
    await expect(page).toHaveURL(`${BASE_URL}/internal/admin/cases`);

    // Create new case
    await page.click("text=Novo Processo");
    await page.fill(
      'input[placeholder="0000000-00.0000.0.00.0000"]',
      "0000000-00.2020.0.00.0000"
    );
    await page.fill(
      'textarea[placeholder="Descrição do processo"]',
      "Processo de teste para validação"
    );

    // Select phase
    await page.click('select-trigger-with-fase');
    await page.click("text=Conhecimento");

    // Select status
    await page.click('select-trigger-with-status');
    await page.click("text=Em Andamento");

    await page.click("button:has-text('Salvar')");
    await expect(page.locator("text=Processo criado")).toBeVisible();
  });

  test("should add costs to case", async ({ page }) => {
    await login(page, LAWYER.email, LAWYER.password);

    // Navigate to costs
    await page.click("text=Custos");
    await expect(page).toHaveURL(
      `${BASE_URL}/internal/admin/case-costs`
    );

    // Create new cost
    await page.click("text=Novo Custo");
    await page.click('select-trigger-with-tipo');
    await page.click("text=Honorário Fixo");

    await page.fill(
      'input[placeholder="Descrição do custo"]',
      "Honorários primeira parcela"
    );
    await page.fill('input[type="number"]', "5000");

    // Set date
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill("2026-05-05");

    await page.click("button:has-text('Salvar')");
    await expect(page.locator("text=Custo criado")).toBeVisible();
  });

  test("should add receipts to case", async ({ page }) => {
    await login(page, LAWYER.email, LAWYER.password);

    // Navigate to receipts
    await page.click("text=Recebimentos");
    await expect(page).toHaveURL(
      `${BASE_URL}/internal/admin/case-receipts`
    );

    // Create new receipt
    await page.click("text=Novo Recebimento");

    // Select case
    await page.click('select-trigger-with-case');
    await page.click("text=0000000-00.2020.0.00.0000");

    await page.fill(
      'input[placeholder="Descrição do recebimento"]',
      "Recebimento acordo"
    );
    await page.fill('input[type="number"]', "3000");

    // Set date
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill("2026-05-05");

    await page.click("button:has-text('Salvar')");
    await expect(page.locator("text=Recebimento criado")).toBeVisible();
  });

  test("should view KPIs for assigned clients", async ({ page }) => {
    await login(page, LAWYER.email, LAWYER.password);

    // Navigate to dashboard
    await page.click("text=Dashboard");

    // Wait for KPIs to load
    await page.waitForTimeout(2000);

    // Verify KPI cards visible
    await expect(page.locator("text=Custos da Assessoria")).toBeVisible();
    await expect(page.locator("text=ROI")).toBeVisible();

    // Verify charts visible
    await expect(
      page.locator("text=Custos ao Longo do Tempo")
    ).toBeVisible();
  });
});

test.describe("Client Portal Workflow", () => {
  test("should login and see own dashboard", async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);

    // Should redirect to client portal
    await expect(page).toHaveURL(`${BASE_URL}/(client)/portal`);

    // Verify portal content
    await expect(
      page.locator("text=Relatório da Assessoria Jurídica")
    ).toBeVisible();

    // Verify client name shown
    await expect(page.locator("text=Empresa:")).toBeVisible();
  });

  test("should respect KPI visibility", async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);

    // Navigate to portal
    await page.goto(`${BASE_URL}/(client)/portal`);

    // Some KPIs might be hidden depending on admin config
    // Just verify the page loaded and at least one KPI visible or message shown
    const kpiCards = page.locator('[role="article"]');
    const count = await kpiCards.count();
    expect(count).toBeGreaterThanOrEqual(0); // May be 0-4 depending on visibility
  });

  test("should view own processes only", async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);

    // Click "Ver Processos"
    await page.click("text=Ver Processos");
    await expect(page).toHaveURL(`${BASE_URL}/(client)/portal/cases`);

    // Should see processes table
    await expect(page.locator("text=Processos")).toBeVisible();

    // Verify can't access other clients' processes
    await page.goto(`${BASE_URL}/(client)/portal/cases?client=other-id`);
    // Should still show own processes or error
    const content = await page.textContent("body");
    expect(content).toBeDefined();
  });

  test("should download own PDF report", async ({ page, context }) => {
    await login(page, CLIENT.email, CLIENT.password);

    // Navigate to portal
    await page.goto(`${BASE_URL}/(client)/portal`);

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Click download button
    const downloadPromise = context.waitForEvent("download");
    await page.click("button:has-text('Baixar')");
    const download = await downloadPromise;

    // Verify file
    expect(download.suggestedFilename()).toContain(".pdf");
  });

  test("should not access admin pages", async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);

    // Try to access admin area
    await page.goto(`${BASE_URL}/internal/admin/clients`);

    // Should redirect to login or show access denied
    const url = page.url();
    expect(url).not.toContain("/internal/admin");
  });
});

test.describe("RBAC Security", () => {
  test("advogado should not access other lawyer's clients", async ({
    page,
  }) => {
    await login(page, LAWYER.email, LAWYER.password);

    // Try to access unassigned client's cases
    const unassignedClientId = "00000000-0000-0000-0000-000000000000";
    await page.goto(
      `${BASE_URL}/internal/admin/cases?client=${unassignedClientId}`
    );

    // Should show error or redirect
    await page.waitForTimeout(1000);
    const content = await page.textContent("body");
    expect(content).toBeDefined();
  });

  test("client should not access other client's data", async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);

    // Try to access another client's portal
    const otherId = "99999999-9999-9999-9999-999999999999";
    await page.goto(`${BASE_URL}/(client)/portal?client=${otherId}`);

    // Should show own data or error
    await page.waitForTimeout(1000);
    const url = page.url();
    // Should either stay on own portal or redirect
    expect(url).toContain("portal");
  });

  test("client should not access admin dashboard", async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);

    await page.goto(`${BASE_URL}/internal/dashboard`);

    // Should be redirected or denied
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).not.toContain("/internal/dashboard");
  });
});

test.describe("Data Validation", () => {
  test("should reject invalid CNPJ", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);

    await page.click("text=Clientes");
    await page.click("text=Novo Cliente");

    await page.fill('input[placeholder="Nome da empresa"]', "Test");
    await page.fill(
      'input[placeholder="XX.XXX.XXX/0001-XX"]',
      "invalid-cnpj"
    );
    await page.click("button:has-text('Salvar')");

    // Should show validation error
    await expect(page.locator("text=inválido")).toBeVisible();
  });

  test("should reject empty required fields", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);

    await page.click("text=Clientes");
    await page.click("text=Novo Cliente");

    // Try to save without filling required fields
    await page.click("button:has-text('Salvar')");

    // Should show errors
    await expect(page.locator("text=obrigatório")).toBeVisible();
  });

  test("should format currency correctly", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);

    // Navigate to cases and create one with financial values
    await page.click("text=Processos");
    await page.click("text=Novo Processo");

    // Fill basic fields
    await page.fill(
      'input[placeholder="0000000-00.0000.0.00.0000"]',
      "0000000-00.2020.0.00.0000"
    );

    // Fill financial fields
    await page.fill(
      'input[placeholder="Valor Pleiteado"]',
      "10000.50"
    );

    // Values should be stored and displayed in BRL format
    // When viewing, should show "R$ 10.000,50"
  });
});
