-- ============================================================
-- FFADV Assessorias — Dados de Demonstração
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ── 1. Criar usuários demo no Auth ──────────────────────────
-- (Supabase não permite INSERT direto em auth.users via SQL Editor)
-- Os usuários abaixo serão criados via função admin.
-- Se preferir, crie manualmente em Authentication > Users.

-- Cria usuários via função (requer extensão pgcrypto, já inclusa no Supabase)
DO $$
DECLARE
  ctrl_id   uuid := gen_random_uuid();
  adv1_id   uuid := gen_random_uuid();
  adv2_id   uuid := gen_random_uuid();
  cli1_id   uuid := gen_random_uuid();
  cli2_id   uuid := gen_random_uuid();
  admin_id  uuid;
  client1   uuid := '77777777-0000-0000-0000-000000000001'::uuid;
  client2   uuid := '88888888-0000-0000-0000-000000000001'::uuid;
BEGIN

  -- Busca UUID do admin já existente
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@ffjus.com.br' LIMIT 1;
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Usuário admin@ffjus.com.br não encontrado. Crie-o primeiro.';
  END IF;

  RAISE NOTICE 'Admin UUID: %', admin_id;

  -- Garante perfil do admin
  INSERT INTO profiles (id, role, client_id, nome, ativo)
  VALUES (admin_id, 'admin', NULL, 'Gustavo Fontes', true)
  ON CONFLICT (id) DO UPDATE SET role = 'admin', nome = 'Gustavo Fontes', ativo = true;

  -- ── 2. Criar usuários demo no auth.users ──────────────────
  -- Controller
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'controller@ffjus.com.br') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      aud, role, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
      ctrl_id, '00000000-0000-0000-0000-000000000000',
      'controller@ffjus.com.br',
      crypt('demo123', gen_salt('bf')),
      now(), 'authenticated', 'authenticated', now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
    );
    RAISE NOTICE 'Criado controller: %', ctrl_id;
  ELSE
    SELECT id INTO ctrl_id FROM auth.users WHERE email = 'controller@ffjus.com.br';
    RAISE NOTICE 'Controller já existe: %', ctrl_id;
  END IF;

  -- Advogado 1
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'advogado1@ffjus.com.br') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      aud, role, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
      adv1_id, '00000000-0000-0000-0000-000000000000',
      'advogado1@ffjus.com.br',
      crypt('demo123', gen_salt('bf')),
      now(), 'authenticated', 'authenticated', now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
    );
    RAISE NOTICE 'Criado advogado1: %', adv1_id;
  ELSE
    SELECT id INTO adv1_id FROM auth.users WHERE email = 'advogado1@ffjus.com.br';
    RAISE NOTICE 'Advogado1 já existe: %', adv1_id;
  END IF;

  -- Advogado 2
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'advogado2@ffjus.com.br') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      aud, role, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
      adv2_id, '00000000-0000-0000-0000-000000000000',
      'advogado2@ffjus.com.br',
      crypt('demo123', gen_salt('bf')),
      now(), 'authenticated', 'authenticated', now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
    );
    RAISE NOTICE 'Criado advogado2: %', adv2_id;
  ELSE
    SELECT id INTO adv2_id FROM auth.users WHERE email = 'advogado2@ffjus.com.br';
    RAISE NOTICE 'Advogado2 já existe: %', adv2_id;
  END IF;

  -- Cliente 1
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'cliente1@empresa.com.br') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      aud, role, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
      cli1_id, '00000000-0000-0000-0000-000000000000',
      'cliente1@empresa.com.br',
      crypt('demo123', gen_salt('bf')),
      now(), 'authenticated', 'authenticated', now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
    );
    RAISE NOTICE 'Criado cliente1: %', cli1_id;
  ELSE
    SELECT id INTO cli1_id FROM auth.users WHERE email = 'cliente1@empresa.com.br';
    RAISE NOTICE 'Cliente1 já existe: %', cli1_id;
  END IF;

  -- Cliente 2
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'cliente2@empresa.com.br') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      aud, role, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
      cli2_id, '00000000-0000-0000-0000-000000000000',
      'cliente2@empresa.com.br',
      crypt('demo123', gen_salt('bf')),
      now(), 'authenticated', 'authenticated', now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
    );
    RAISE NOTICE 'Criado cliente2: %', cli2_id;
  ELSE
    SELECT id INTO cli2_id FROM auth.users WHERE email = 'cliente2@empresa.com.br';
    RAISE NOTICE 'Cliente2 já existe: %', cli2_id;
  END IF;

  -- ── 3. Criar clientes (empresas) ──────────────────────────
  INSERT INTO clients (id, razao_social, cnpj, responsavel_id, ativo, kpi_visibility)
  VALUES
    (client1, 'Tech Solutions Ltda', '12.345.678/0001-90', admin_id, true,
     '{"custos": true, "evitadas": true, "recebidos": true, "roi": true}'::jsonb),
    (client2, 'Comércio Premium SA',  '98.765.432/0001-10', admin_id, true,
     '{"custos": true, "evitadas": true, "recebidos": true, "roi": true}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  -- ── 4. Profiles de usuários internos ──────────────────────
  INSERT INTO profiles (id, role, client_id, nome, ativo)
  VALUES
    (ctrl_id, 'controller', NULL,    'Ana Silva',     true),
    (adv1_id, 'advogado',   NULL,    'Carlos Santos', true),
    (adv2_id, 'advogado',   NULL,    'Marina Costa',  true),
    (cli1_id, 'cliente',    client1, 'João Empresa',  true),
    (cli2_id, 'cliente',    client2, 'Maria Negócios',true)
  ON CONFLICT (id) DO UPDATE
    SET role = EXCLUDED.role, client_id = EXCLUDED.client_id,
        nome = EXCLUDED.nome, ativo = EXCLUDED.ativo;

  -- ── 5. Atribuições advogado ↔ cliente ─────────────────────
  INSERT INTO lawyer_assignments (advogado_id, client_id)
  VALUES
    (adv1_id, client1),
    (adv1_id, client2),
    (adv2_id, client2)
  ON CONFLICT DO NOTHING;

  -- ── 6. Processos ──────────────────────────────────────────
  INSERT INTO cases (
    id, client_id, numero_processo, descricao, fase, status,
    valor_pleiteado_contra, valor_condenado_contra,
    valor_condenacao_favoravel, valor_acordo_recebido,
    advogado_responsavel_id
  ) VALUES
    ('c1111111-1111-1111-1111-111111111111', client1,
     '0001234-89.2023.8.26.0100', 'Cobrança de serviços prestados não pagos',
     'conhecimento', 'em_andamento', 50000, 0, 0, 0, adv1_id),

    ('c2222222-2222-2222-2222-222222222222', client1,
     '0005678-23.2022.8.26.0100', 'Ação indenizatória por danos morais e materiais',
     'recurso', 'em_andamento', 100000, 20000, 0, 0, adv1_id),

    ('c3333333-3333-3333-3333-333333333333', client1,
     '0007890-11.2021.8.26.0100', 'Ação trabalhista — sentença transitada em julgado',
     'encerrado', 'resolvido', 80000, 15000, 65000, 0, adv1_id),

    ('c4444444-4444-4444-4444-444444444444', client2,
     '0002341-56.2024.8.26.0100', 'Disputa contratual por rescisão antecipada',
     'conhecimento', 'em_andamento', 75000, 0, 0, 0, adv2_id),

    ('c5555555-5555-5555-5555-555555555555', client2,
     '0009999-11.2021.8.26.0100', 'Execução de sentença — acordo homologado',
     'execucao', 'resolvido', 30000, 5000, 0, 25000, adv2_id)
  ON CONFLICT (id) DO NOTHING;

  -- ── 7. Custos de assessoria ───────────────────────────────
  INSERT INTO case_costs (client_id, case_id, tipo, descricao, valor, data_competencia)
  VALUES
    (client1, 'c1111111-1111-1111-1111-111111111111', 'honorario_fixo',    'Honorários mensais – jan/2024',        5000, '2024-01-15'),
    (client1, 'c2222222-2222-2222-2222-222222222222', 'honorario_variavel','Honorários recursais – fev/2024',       8000, '2024-02-20'),
    (client1, 'c1111111-1111-1111-1111-111111111111', 'custas',            'Custas de citação',                      800, '2024-03-01'),
    (client1, NULL,                                   'honorario_fixo',    'Assessoria geral – abr/2024',           3000, '2024-04-01'),
    (client1, NULL,                                   'honorario_fixo',    'Assessoria geral – mai/2024',           3000, '2024-05-01'),
    (client2, 'c4444444-4444-4444-4444-444444444444', 'custas',            'Custas judiciais iniciais',             1500, '2024-03-10'),
    (client2, 'c5555555-5555-5555-5555-555555555555', 'honorario_fixo',    'Honorários de execução',                4000, '2024-04-05'),
    (client2, NULL,                                   'honorario_fixo',    'Assessoria geral – mai/2024',           2500, '2024-05-01');

  -- ── 8. Recebimentos ───────────────────────────────────────
  INSERT INTO case_receipts (client_id, case_id, descricao, valor, data)
  VALUES
    (client1, 'c3333333-3333-3333-3333-333333333333', 'Recebimento de sentença favorável', 65000, '2024-03-15'),
    (client1, NULL,                                   'Crédito de consultoria preventiva',  5000, '2024-05-05'),
    (client2, 'c5555555-5555-5555-5555-555555555555', 'Recebimento de acordo homologado',  25000, '2024-04-20');

  RAISE NOTICE '✅ Seed concluído com sucesso!';
  RAISE NOTICE '   Clientes criados: Tech Solutions Ltda e Comércio Premium SA';
  RAISE NOTICE '   Processos: 5  |  Custos: 8  |  Recebimentos: 3';

END $$;

-- ── Verificação ────────────────────────────────────────────────────────────
SELECT 'profiles'      AS tabela, COUNT(*) AS total FROM profiles
UNION ALL
SELECT 'clients',       COUNT(*) FROM clients
UNION ALL
SELECT 'lawyer_assignments', COUNT(*) FROM lawyer_assignments
UNION ALL
SELECT 'cases',         COUNT(*) FROM cases
UNION ALL
SELECT 'case_costs',    COUNT(*) FROM case_costs
UNION ALL
SELECT 'case_receipts', COUNT(*) FROM case_receipts
ORDER BY tabela;
