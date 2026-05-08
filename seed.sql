-- FFADV Assessorias - Dados de Seed para Demo
-- Execute este script APÓS o setup.sql

-- ============================================
-- 1. CRIAR USUÁRIOS NO AUTH
-- ============================================

-- Nota: No Supabase, você precisa criar usuários através da interface de Auth
-- ou usar uma função. Para demo, vamos usar IDs fictícios e você pode criar
-- manualmente ou usar a API do Supabase.

-- UUIDs dos usuários criados no Supabase Auth:
-- Admin: e4498c11-cedc-420b-8f81-17294dfe3d7d
-- Controller: db3c77b9-ac20-4cb8-80a6-88bac1c1d316
-- Advogado 1: d1ad8739-49c0-43e2-b121-5354cf5f4177
-- Advogado 2: 653a8826-90fd-4757-ad63-6268030973c8
-- Cliente 1: 40e95ad5-d6d0-47f6-86ed-8588e71fdf61
-- Cliente 2: 97ec9a96-8593-4d84-8691-916b2b1ddaab

-- ============================================
-- 2. CRIAR PROFILES
-- ============================================

INSERT INTO profiles (id, role, client_id, nome, ativo) VALUES
  ('e4498c11-cedc-420b-8f81-17294dfe3d7d', 'admin', NULL, 'Gustavo Fontes', true),
  ('db3c77b9-ac20-4cb8-80a6-88bac1c1d316', 'controller', NULL, 'Ana Silva', true),
  ('d1ad8739-49c0-43e2-b121-5354cf5f4177', 'advogado', NULL, 'Carlos Santos', true),
  ('653a8826-90fd-4757-ad63-6268030973c8', 'advogado', NULL, 'Marina Costa', true),
  ('40e95ad5-d6d0-47f6-86ed-8588e71fdf61', 'cliente', NULL, 'João Empresa', true),
  ('97ec9a96-8593-4d84-8691-916b2b1ddaab', 'cliente', NULL, 'Maria Negócios', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. CRIAR CLIENTES
-- ============================================

INSERT INTO clients (id, razao_social, cnpj, responsavel_id, ativo, kpi_visibility) VALUES
  ('77777777-7777-7777-7777-777777777777', 'Tech Solutions Ltda', '12.345.678/0001-90', 'e4498c11-cedc-420b-8f81-17294dfe3d7d', true, '{"custos": true, "evitadas": true, "recebidos": true, "roi": true}'),
  ('88888888-8888-8888-8888-888888888888', 'Comércio Premium SA', '98.765.432/0001-10', 'e4498c11-cedc-420b-8f81-17294dfe3d7d', true, '{"custos": true, "evitadas": true, "recebidos": true, "roi": true}')
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. ATUALIZAR PROFILES COM CLIENT_ID PARA CLIENTES
-- ============================================

UPDATE profiles
SET client_id = '77777777-7777-7777-7777-777777777777'
WHERE id = '40e95ad5-d6d0-47f6-86ed-8588e71fdf61';

UPDATE profiles
SET client_id = '88888888-8888-8888-8888-888888888888'
WHERE id = '97ec9a96-8593-4d84-8691-916b2b1ddaab';

-- ============================================
-- 5. ATRIBUIR ADVOGADOS A CLIENTES
-- ============================================

INSERT INTO lawyer_assignments (advogado_id, client_id) VALUES
  ('d1ad8739-49c0-43e2-b121-5354cf5f4177', '77777777-7777-7777-7777-777777777777'),
  ('d1ad8739-49c0-43e2-b121-5354cf5f4177', '88888888-8888-8888-8888-888888888888'),
  ('653a8826-90fd-4757-ad63-6268030973c8', '88888888-8888-8888-8888-888888888888')
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. CRIAR PROCESSOS
-- ============================================

INSERT INTO cases (id, client_id, numero_processo, descricao, fase, status, valor_pleiteado_contra, valor_condenado_contra, valor_condenacao_favoravel, advogado_responsavel_id) VALUES
  ('99999999-9999-9999-9999-999999999999', '77777777-7777-7777-7777-777777777777', '0001234-89.2023.8.26.0100', 'Cobrança de serviços prestados', 'conhecimento', 'em_andamento', 50000.00, 0.00, 0.00, 'd1ad8739-49c0-43e2-b121-5354cf5f4177'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '77777777-7777-7777-7777-777777777777', '0005678-23.2022.8.26.0100', 'Ação indenizatória', 'recurso', 'em_andamento', 100000.00, 20000.00, 80000.00, 'd1ad8739-49c0-43e2-b121-5354cf5f4177'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '88888888-8888-8888-8888-888888888888', '0002341-56.2024.8.26.0100', 'Disputa contratual', 'conhecimento', 'em_andamento', 75000.00, 0.00, 0.00, '653a8826-90fd-4757-ad63-6268030973c8'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888888', '0009999-11.2021.8.26.0100', 'Execução de sentença', 'execucao', 'resolvido', 30000.00, 5000.00, 25000.00, '653a8826-90fd-4757-ad63-6268030973c8')
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. CRIAR CUSTOS DE ASSESSORIA
-- ============================================

INSERT INTO case_costs (case_id, client_id, tipo, descricao, valor, data_competencia) VALUES
  ('99999999-9999-9999-9999-999999999999', '77777777-7777-7777-7777-777777777777', 'honorario_fixo', 'Honorários de assessoria - Cobrança', 5000.00, '2024-01-15'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '77777777-7777-7777-7777-777777777777', 'honorario_variavel', 'Honorários recursais', 8000.00, '2024-02-20'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '88888888-8888-8888-8888-888888888888', 'custas', 'Custas judiciais', 1500.00, '2024-03-10'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888888', 'honorario_fixo', 'Honorários de execução', 4000.00, '2024-04-05'),
  (NULL, '77777777-7777-7777-7777-777777777777', 'outro', 'Assessoria geral do mês', 3000.00, '2024-05-01')
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. CRIAR RECEBIMENTOS
-- ============================================

INSERT INTO case_receipts (case_id, client_id, descricao, valor, data) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '77777777-7777-7777-7777-777777777777', 'Recebimento de sentença favorável', 80000.00, '2024-03-15'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888888', 'Recebimento de acordo', 25000.00, '2024-04-20'),
  (NULL, '77777777-7777-7777-7777-777777777777', 'Recebimento de consultoria', 5000.00, '2024-05-01')
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. REGISTRAR AUDITORIA
-- ============================================

INSERT INTO audit_log (actor_id, entity, entity_id, action) VALUES
  ('e4498c11-cedc-420b-8f81-17294dfe3d7d', 'clients', '77777777-7777-7777-7777-777777777777', 'CREATE'),
  ('e4498c11-cedc-420b-8f81-17294dfe3d7d', 'clients', '88888888-8888-8888-8888-888888888888', 'CREATE'),
  ('e4498c11-cedc-420b-8f81-17294dfe3d7d', 'cases', '99999999-9999-9999-9999-999999999999', 'CREATE'),
  ('d1ad8739-49c0-43e2-b121-5354cf5f4177', 'case_costs', '99999999-9999-9999-9999-999999999999', 'CREATE')
ON CONFLICT DO NOTHING;

-- ============================================
-- 10. VERIFICAÇÃO
-- ============================================

-- Contar registros criados
SELECT
  'profiles' as tabela, COUNT(*) as total FROM profiles
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'lawyer_assignments', COUNT(*) FROM lawyer_assignments
UNION ALL
SELECT 'cases', COUNT(*) FROM cases
UNION ALL
SELECT 'case_costs', COUNT(*) FROM case_costs
UNION ALL
SELECT 'case_receipts', COUNT(*) FROM case_receipts
UNION ALL
SELECT 'audit_log', COUNT(*) FROM audit_log;
