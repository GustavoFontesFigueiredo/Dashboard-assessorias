/**
 * Script de dados de demonstração para FFADV Assessorias
 * Executa: npx tsx scripts/seed-demo.ts
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log("🌱 Iniciando seed de demonstração...\n");

  // ── 1. Buscar o admin já existente ──────────────────────────────────────
  const { data: adminList } = await supabase.auth.admin.listUsers();
  const adminUser = adminList?.users?.find(
    (u) => u.email === "admin@ffjus.com.br",
  );
  if (!adminUser) {
    console.error("❌ Usuário admin@ffjus.com.br não encontrado. Execute o setup primeiro.");
    process.exit(1);
  }
  const ADMIN_ID = adminUser.id;
  console.log(`✅ Admin encontrado: ${ADMIN_ID}`);

  // ── 2. Criar usuários demo no Auth ───────────────────────────────────────
  const demoUsers = [
    { email: "controller@ffjus.com.br", password: "demo123", nome: "Ana Silva", role: "controller" },
    { email: "advogado1@ffjus.com.br",  password: "demo123", nome: "Carlos Santos", role: "advogado" },
    { email: "advogado2@ffjus.com.br",  password: "demo123", nome: "Marina Costa", role: "advogado" },
    { email: "cliente1@empresa.com.br", password: "demo123", nome: "João Empresa", role: "cliente" },
    { email: "cliente2@empresa.com.br", password: "demo123", nome: "Maria Negócios", role: "cliente" },
  ];

  const userIds: Record<string, string> = { admin: ADMIN_ID };

  for (const u of demoUsers) {
    // Verifica se já existe
    const existing = adminList?.users?.find((au) => au.email === u.email);
    if (existing) {
      userIds[u.email] = existing.id;
      console.log(`  ↩ Usuário já existe: ${u.email} (${existing.id})`);
      continue;
    }
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    });
    if (error) {
      console.error(`  ❌ Erro ao criar ${u.email}:`, error.message);
    } else {
      userIds[u.email] = data.user.id;
      console.log(`  ✅ Usuário criado: ${u.email} (${data.user.id})`);
    }
  }

  // ── 3. Upsert profiles ────────────────────────────────────────────────────
  console.log("\n📋 Criando profiles...");

  // Garantir profile do admin
  await supabase.from("profiles").upsert(
    { id: ADMIN_ID, role: "admin", client_id: null, nome: "Gustavo Fontes", ativo: true },
    { onConflict: "id" },
  );

  const profilesData = [
    { key: "controller@ffjus.com.br", role: "controller", client_id: null, nome: "Ana Silva" },
    { key: "advogado1@ffjus.com.br",  role: "advogado",   client_id: null, nome: "Carlos Santos" },
    { key: "advogado2@ffjus.com.br",  role: "advogado",   client_id: null, nome: "Marina Costa" },
  ];
  for (const p of profilesData) {
    if (!userIds[p.key]) continue;
    const { error } = await supabase.from("profiles").upsert(
      { id: userIds[p.key], role: p.role, client_id: p.client_id, nome: p.nome, ativo: true },
      { onConflict: "id" },
    );
    if (error) console.error(`  ❌ Profile ${p.key}:`, error.message);
    else console.log(`  ✅ Profile: ${p.nome} (${p.role})`);
  }

  // ── 4. Criar clientes ─────────────────────────────────────────────────────
  console.log("\n🏢 Criando clientes...");
  const CLIENT1_ID = "77777777-7777-7777-7777-777777777771";
  const CLIENT2_ID = "88888888-8888-8888-8888-888888888881";

  const { error: c1err } = await supabase.from("clients").upsert(
    {
      id: CLIENT1_ID,
      razao_social: "Tech Solutions Ltda",
      cnpj: "12.345.678/0001-90",
      responsavel_id: ADMIN_ID,
      ativo: true,
      kpi_visibility: { custos: true, evitadas: true, recebidos: true, roi: true },
    },
    { onConflict: "id" },
  );
  if (c1err) console.error("  ❌ Client1:", c1err.message);
  else console.log("  ✅ Tech Solutions Ltda");

  const { error: c2err } = await supabase.from("clients").upsert(
    {
      id: CLIENT2_ID,
      razao_social: "Comércio Premium SA",
      cnpj: "98.765.432/0001-10",
      responsavel_id: ADMIN_ID,
      ativo: true,
      kpi_visibility: { custos: true, evitadas: true, recebidos: true, roi: true },
    },
    { onConflict: "id" },
  );
  if (c2err) console.error("  ❌ Client2:", c2err.message);
  else console.log("  ✅ Comércio Premium SA");

  // ── 5. Vincular usuários cliente aos clientes ─────────────────────────────
  console.log("\n🔗 Vinculando usuários clientes...");
  if (userIds["cliente1@empresa.com.br"]) {
    await supabase.from("profiles").upsert(
      { id: userIds["cliente1@empresa.com.br"], role: "cliente", client_id: CLIENT1_ID, nome: "João Empresa", ativo: true },
      { onConflict: "id" },
    );
    console.log("  ✅ João Empresa → Tech Solutions");
  }
  if (userIds["cliente2@empresa.com.br"]) {
    await supabase.from("profiles").upsert(
      { id: userIds["cliente2@empresa.com.br"], role: "cliente", client_id: CLIENT2_ID, nome: "Maria Negócios", ativo: true },
      { onConflict: "id" },
    );
    console.log("  ✅ Maria Negócios → Comércio Premium");
  }

  // ── 6. Atribuições advogado ↔ cliente ─────────────────────────────────────
  console.log("\n⚖️  Criando atribuições...");
  const adv1 = userIds["advogado1@ffjus.com.br"];
  const adv2 = userIds["advogado2@ffjus.com.br"];
  if (adv1) {
    await supabase.from("lawyer_assignments").upsert(
      [{ advogado_id: adv1, client_id: CLIENT1_ID }, { advogado_id: adv1, client_id: CLIENT2_ID }],
      { onConflict: "advogado_id,client_id" },
    );
    console.log("  ✅ Carlos Santos → Tech Solutions + Comércio Premium");
  }
  if (adv2) {
    await supabase.from("lawyer_assignments").upsert(
      [{ advogado_id: adv2, client_id: CLIENT2_ID }],
      { onConflict: "advogado_id,client_id" },
    );
    console.log("  ✅ Marina Costa → Comércio Premium");
  }

  // ── 7. Processos ──────────────────────────────────────────────────────────
  console.log("\n📁 Criando processos...");
  const CASE1 = "c1111111-1111-1111-1111-111111111111";
  const CASE2 = "c2222222-2222-2222-2222-222222222222";
  const CASE3 = "c3333333-3333-3333-3333-333333333333";
  const CASE4 = "c4444444-4444-4444-4444-444444444444";
  const CASE5 = "c5555555-5555-5555-5555-555555555555";

  const cases = [
    {
      id: CASE1,
      client_id: CLIENT1_ID,
      numero_processo: "0001234-89.2023.8.26.0100",
      descricao: "Cobrança de serviços prestados não pagos",
      fase: "conhecimento",
      status: "em_andamento",
      valor_pleiteado_contra: 50000,
      valor_condenado_contra: 0,
      valor_condenacao_favoravel: 0,
      valor_acordo_recebido: 0,
      advogado_responsavel_id: adv1 ?? ADMIN_ID,
    },
    {
      id: CASE2,
      client_id: CLIENT1_ID,
      numero_processo: "0005678-23.2022.8.26.0100",
      descricao: "Ação indenizatória por danos morais e materiais",
      fase: "recurso",
      status: "em_andamento",
      valor_pleiteado_contra: 100000,
      valor_condenado_contra: 20000,
      valor_condenacao_favoravel: 0,
      valor_acordo_recebido: 0,
      advogado_responsavel_id: adv1 ?? ADMIN_ID,
    },
    {
      id: CASE3,
      client_id: CLIENT1_ID,
      numero_processo: "0007890-11.2021.8.26.0100",
      descricao: "Ação de cobrança de crédito trabalhista",
      fase: "encerrado",
      status: "resolvido",
      valor_pleiteado_contra: 80000,
      valor_condenado_contra: 15000,
      valor_condenacao_favoravel: 65000,
      valor_acordo_recebido: 0,
      advogado_responsavel_id: adv1 ?? ADMIN_ID,
    },
    {
      id: CASE4,
      client_id: CLIENT2_ID,
      numero_processo: "0002341-56.2024.8.26.0100",
      descricao: "Disputa contratual por rescisão antecipada",
      fase: "conhecimento",
      status: "em_andamento",
      valor_pleiteado_contra: 75000,
      valor_condenado_contra: 0,
      valor_condenacao_favoravel: 0,
      valor_acordo_recebido: 0,
      advogado_responsavel_id: adv2 ?? ADMIN_ID,
    },
    {
      id: CASE5,
      client_id: CLIENT2_ID,
      numero_processo: "0009999-11.2021.8.26.0100",
      descricao: "Execução de sentença — acordo homologado",
      fase: "execucao",
      status: "resolvido",
      valor_pleiteado_contra: 30000,
      valor_condenado_contra: 5000,
      valor_condenacao_favoravel: 0,
      valor_acordo_recebido: 25000,
      advogado_responsavel_id: adv2 ?? ADMIN_ID,
    },
  ];

  const { error: casesErr } = await supabase
    .from("cases")
    .upsert(cases, { onConflict: "id" });
  if (casesErr) console.error("  ❌ Cases:", casesErr.message);
  else console.log(`  ✅ ${cases.length} processos inseridos`);

  // ── 8. Custos ─────────────────────────────────────────────────────────────
  console.log("\n💸 Criando lançamentos de custo...");
  const costs = [
    { client_id: CLIENT1_ID, case_id: CASE1, tipo: "honorario_fixo",     descricao: "Honorários mensais – jan/2024",       valor: 5000,  data_competencia: "2024-01-15" },
    { client_id: CLIENT1_ID, case_id: CASE2, tipo: "honorario_variavel",  descricao: "Honorários recursais – fev/2024",      valor: 8000,  data_competencia: "2024-02-20" },
    { client_id: CLIENT1_ID, case_id: CASE1, tipo: "custas",              descricao: "Custas de citação",                    valor: 800,   data_competencia: "2024-03-01" },
    { client_id: CLIENT1_ID, case_id: null,  tipo: "honorario_fixo",      descricao: "Assessoria geral – abr/2024",          valor: 3000,  data_competencia: "2024-04-01" },
    { client_id: CLIENT1_ID, case_id: null,  tipo: "honorario_fixo",      descricao: "Assessoria geral – mai/2024",          valor: 3000,  data_competencia: "2024-05-01" },
    { client_id: CLIENT2_ID, case_id: CASE4, tipo: "custas",              descricao: "Custas judiciais iniciais",            valor: 1500,  data_competencia: "2024-03-10" },
    { client_id: CLIENT2_ID, case_id: CASE5, tipo: "honorario_fixo",      descricao: "Honorários de execução",               valor: 4000,  data_competencia: "2024-04-05" },
    { client_id: CLIENT2_ID, case_id: null,  tipo: "honorario_fixo",      descricao: "Assessoria geral – mai/2024",          valor: 2500,  data_competencia: "2024-05-01" },
  ];

  const { error: costsErr } = await supabase.from("case_costs").insert(costs);
  if (costsErr) console.error("  ❌ Costs:", costsErr.message);
  else console.log(`  ✅ ${costs.length} lançamentos de custo`);

  // ── 9. Recebimentos ───────────────────────────────────────────────────────
  console.log("\n💰 Criando recebimentos...");
  const receipts = [
    { client_id: CLIENT1_ID, case_id: CASE3, descricao: "Recebimento de sentença favorável – execução", valor: 65000, data: "2024-03-15" },
    { client_id: CLIENT1_ID, case_id: null,  descricao: "Crédito de consultoria preventiva",            valor: 5000,  data: "2024-05-05" },
    { client_id: CLIENT2_ID, case_id: CASE5, descricao: "Recebimento de acordo homologado",             valor: 25000, data: "2024-04-20" },
  ];

  const { error: receiptsErr } = await supabase.from("case_receipts").insert(receipts);
  if (receiptsErr) console.error("  ❌ Receipts:", receiptsErr.message);
  else console.log(`  ✅ ${receipts.length} recebimentos`);

  // ── 10. Resumo ────────────────────────────────────────────────────────────
  console.log("\n📊 Resumo do seed:");
  const counts = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("cases").select("*", { count: "exact", head: true }),
    supabase.from("case_costs").select("*", { count: "exact", head: true }),
    supabase.from("case_receipts").select("*", { count: "exact", head: true }),
  ]);
  const labels = ["profiles", "clients", "cases", "case_costs", "case_receipts"];
  counts.forEach((c, i) => console.log(`  ${labels[i]}: ${c.count ?? 0} registros`));

  console.log("\n✅ Seed concluído!\n");
  console.log("Usuários de acesso:");
  console.log("  Admin:       admin@ffjus.com.br       / admin123");
  console.log("  Controller:  controller@ffjus.com.br  / demo123");
  console.log("  Advogado 1:  advogado1@ffjus.com.br   / demo123");
  console.log("  Advogado 2:  advogado2@ffjus.com.br   / demo123");
  console.log("  Cliente 1:   cliente1@empresa.com.br  / demo123");
  console.log("  Cliente 2:   cliente2@empresa.com.br  / demo123");
}

seed().catch(console.error);
