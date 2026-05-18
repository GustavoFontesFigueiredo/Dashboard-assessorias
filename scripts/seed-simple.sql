-- ============================================================
-- SEED SIMPLIFICADO — rode no SQL Editor do Supabase
-- Insere clientes, processos, custos e recebimentos
-- diretamente (sem depender de UUIDs de auth.users)
-- ============================================================

-- Pega o UUID do admin para usar como responsável
DO $$
DECLARE
  admin_id  uuid;
  client1   uuid := '77777777-0000-0000-0000-000000000001'::uuid;
  client2   uuid := '88888888-0000-0000-0000-000000000001'::uuid;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@ffjus.com.br' LIMIT 1;
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'admin@ffjus.com.br não encontrado';
  END IF;

  -- Garante profile do admin
  INSERT INTO profiles (id, role, nome, ativo)
  VALUES (admin_id, 'admin', 'Gustavo Fontes', true)
  ON CONFLICT (id) DO UPDATE SET role = 'admin', nome = 'Gustavo Fontes', ativo = true;

  -- Clientes
  INSERT INTO clients (id, razao_social, cnpj, ativo, kpi_visibility)
  VALUES
    (client1, 'Tech Solutions Ltda', '12.345.678/0001-90', true,
     '{"custos":true,"evitadas":true,"recebidos":true,"roi":true}'::jsonb),
    (client2, 'Comércio Premium SA', '98.765.432/0001-10', true,
     '{"custos":true,"evitadas":true,"recebidos":true,"roi":true}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  -- Processos
  INSERT INTO cases (id, client_id, numero_processo, descricao, fase, status,
    valor_pleiteado_contra, valor_condenado_contra, valor_condenacao_favoravel, valor_acordo_recebido,
    advogado_responsavel_id)
  VALUES
    ('c1111111-1111-1111-1111-111111111111', client1,
     '0001234-89.2023.8.26.0100', 'Cobrança de serviços prestados',
     'conhecimento','em_andamento', 50000,0,0,0, admin_id),
    ('c2222222-2222-2222-2222-222222222222', client1,
     '0005678-23.2022.8.26.0100', 'Ação indenizatória por danos morais',
     'recurso','em_andamento', 100000,20000,0,0, admin_id),
    ('c3333333-3333-3333-3333-333333333333', client1,
     '0007890-11.2021.8.26.0100', 'Ação trabalhista — sentença transitada',
     'encerrado','resolvido', 80000,15000,65000,0, admin_id),
    ('c4444444-4444-4444-4444-444444444444', client2,
     '0002341-56.2024.8.26.0100', 'Disputa contratual por rescisão',
     'conhecimento','em_andamento', 75000,0,0,0, admin_id),
    ('c5555555-5555-5555-5555-555555555555', client2,
     '0009999-11.2021.8.26.0100', 'Execução de sentença — acordo',
     'execucao','resolvido', 30000,5000,0,25000, admin_id)
  ON CONFLICT (id) DO NOTHING;

  -- Custos
  INSERT INTO case_costs (client_id, case_id, tipo, descricao, valor, data_competencia)
  VALUES
    (client1,'c1111111-1111-1111-1111-111111111111','honorario_fixo','Honorários jan/2024',5000,'2024-01-15'),
    (client1,'c2222222-2222-2222-2222-222222222222','honorario_variavel','Honorários recursais fev/2024',8000,'2024-02-20'),
    (client1,'c1111111-1111-1111-1111-111111111111','custas','Custas de citação',800,'2024-03-01'),
    (client1,NULL,'honorario_fixo','Assessoria geral abr/2024',3000,'2024-04-01'),
    (client1,NULL,'honorario_fixo','Assessoria geral mai/2024',3000,'2024-05-01'),
    (client2,'c4444444-4444-4444-4444-444444444444','custas','Custas iniciais',1500,'2024-03-10'),
    (client2,'c5555555-5555-5555-5555-555555555555','honorario_fixo','Honorários execução',4000,'2024-04-05'),
    (client2,NULL,'honorario_fixo','Assessoria geral mai/2024',2500,'2024-05-01');

  -- Recebimentos
  INSERT INTO case_receipts (client_id, case_id, descricao, valor, data)
  VALUES
    (client1,'c3333333-3333-3333-3333-333333333333','Recebimento de sentença favorável',65000,'2024-03-15'),
    (client1,NULL,'Crédito de consultoria preventiva',5000,'2024-05-05'),
    (client2,'c5555555-5555-5555-5555-555555555555','Recebimento de acordo homologado',25000,'2024-04-20');

  RAISE NOTICE 'Seed concluído! Clientes: Tech Solutions Ltda e Comércio Premium SA';
END $$;

-- Verificação
SELECT 'clients' AS tabela, COUNT(*) FROM clients
UNION ALL SELECT 'cases', COUNT(*) FROM cases
UNION ALL SELECT 'case_costs', COUNT(*) FROM case_costs
UNION ALL SELECT 'case_receipts', COUNT(*) FROM case_receipts;
