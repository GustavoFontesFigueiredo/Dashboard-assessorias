-- FFADV Assessorias Database Setup
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- 1. CRIAR ENUMS
-- ============================================
CREATE TYPE role AS ENUM ('admin', 'controller', 'advogado', 'cliente');

-- ============================================
-- 2. CRIAR TABELAS
-- ============================================

-- clients: Empresas-cliente (criar ANTES de profiles)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  responsavel_id UUID,
  ativo BOOLEAN DEFAULT true,
  kpi_visibility JSONB DEFAULT '{"custos": true, "evitadas": true, "recebidos": true, "roi": true}'::jsonb,
  created_at TIMESTAMP DEFAULT now()
);

-- profiles: Espelha auth.users com role e client_id
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role role NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Adicionar constraint de FK em clients.responsavel_id
ALTER TABLE clients ADD CONSTRAINT fk_clients_responsavel
  FOREIGN KEY (responsavel_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- lawyer_assignments: N:N entre advogados e clientes
CREATE TABLE IF NOT EXISTS lawyer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advogado_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT uq_lawyer_assignments UNIQUE (advogado_id, client_id)
);

-- cases: Processos jurídicos
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  numero_processo TEXT NOT NULL,
  descricao TEXT,
  fase TEXT NOT NULL DEFAULT 'conhecimento',
  status TEXT NOT NULL DEFAULT 'em_andamento',
  valor_pleiteado_contra DECIMAL(15,2) DEFAULT 0,
  valor_condenado_contra DECIMAL(15,2) DEFAULT 0,
  valor_condenacao_favoravel DECIMAL(15,2) DEFAULT 0,
  valor_acordo_recebido DECIMAL(15,2) DEFAULT 0,
  advogado_responsavel_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT uq_case_numero UNIQUE (client_id, numero_processo)
);

-- case_costs: Custos de assessoria
CREATE TABLE IF NOT EXISTS case_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT,
  valor DECIMAL(15,2) NOT NULL,
  data_competencia DATE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- case_receipts: Recebimentos a favor do cliente
CREATE TABLE IF NOT EXISTS case_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  descricao TEXT,
  valor DECIMAL(15,2) NOT NULL,
  data DATE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- audit_log: Log de auditoria
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- 3. CRIAR ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_cnpj ON clients(cnpj);
CREATE INDEX IF NOT EXISTS idx_clients_responsavel ON clients(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_assignments_advogado ON lawyer_assignments(advogado_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_assignments_client ON lawyer_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_client ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_advogado ON cases(advogado_responsavel_id);
CREATE INDEX IF NOT EXISTS idx_case_costs_client ON case_costs(client_id);
CREATE INDEX IF NOT EXISTS idx_case_costs_case ON case_costs(case_id);
CREATE INDEX IF NOT EXISTS idx_case_receipts_client ON case_receipts(client_id);
CREATE INDEX IF NOT EXISTS idx_case_receipts_case ON case_receipts(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_id);

-- ============================================
-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- profiles: Usuários veem apenas seu próprio perfil (admin vê tudo)
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (
    auth.uid() = id OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (
    auth.uid() = id OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- clients: Admin vê tudo, advogado vê atribuídos, cliente vê próprio
CREATE POLICY "clients_select" ON clients FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'controller' OR
    ((SELECT role FROM profiles WHERE id = auth.uid()) = 'advogado' AND
     EXISTS (SELECT 1 FROM lawyer_assignments WHERE advogado_id = auth.uid() AND client_id = id)) OR
    ((SELECT role FROM profiles WHERE id = auth.uid()) = 'cliente' AND
     id = (SELECT client_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "clients_insert" ON clients FOR INSERT
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'controller'));

CREATE POLICY "clients_update" ON clients FOR UPDATE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'controller'));

-- lawyer_assignments
CREATE POLICY "lawyer_assignments_select" ON lawyer_assignments FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'controller') OR
    advogado_id = auth.uid()
  );

CREATE POLICY "lawyer_assignments_insert" ON lawyer_assignments FOR INSERT
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'controller'));

-- cases: Similar à clients
CREATE POLICY "cases_select" ON cases FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'controller' OR
    ((SELECT role FROM profiles WHERE id = auth.uid()) = 'advogado' AND
     (advogado_responsavel_id = auth.uid() OR
      EXISTS (SELECT 1 FROM lawyer_assignments WHERE advogado_id = auth.uid() AND client_id = cases.client_id))) OR
    ((SELECT role FROM profiles WHERE id = auth.uid()) = 'cliente' AND
     client_id = (SELECT client_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "cases_insert" ON cases FOR INSERT
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'controller') OR
    ((SELECT role FROM profiles WHERE id = auth.uid()) = 'advogado' AND
     EXISTS (SELECT 1 FROM lawyer_assignments WHERE advogado_id = auth.uid() AND client_id = cases.client_id))
  );

-- case_costs
CREATE POLICY "case_costs_select" ON case_costs FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'controller') OR
    ((SELECT role FROM profiles WHERE id = auth.uid()) = 'advogado' AND
     EXISTS (SELECT 1 FROM lawyer_assignments WHERE advogado_id = auth.uid() AND client_id = case_costs.client_id)) OR
    ((SELECT role FROM profiles WHERE id = auth.uid()) = 'cliente' AND
     client_id = (SELECT client_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "case_costs_insert" ON case_costs FOR INSERT
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'controller') OR
    ((SELECT role FROM profiles WHERE id = auth.uid()) = 'advogado' AND
     EXISTS (SELECT 1 FROM lawyer_assignments WHERE advogado_id = auth.uid() AND client_id = case_costs.client_id))
  );

-- case_receipts
CREATE POLICY "case_receipts_select" ON case_receipts FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'controller') OR
    ((SELECT role FROM profiles WHERE id = auth.uid()) = 'advogado' AND
     EXISTS (SELECT 1 FROM lawyer_assignments WHERE advogado_id = auth.uid() AND client_id = case_receipts.client_id)) OR
    ((SELECT role FROM profiles WHERE id = auth.uid()) = 'cliente' AND
     client_id = (SELECT client_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "case_receipts_insert" ON case_receipts FOR INSERT
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'controller') OR
    ((SELECT role FROM profiles WHERE id = auth.uid()) = 'advogado' AND
     EXISTS (SELECT 1 FROM lawyer_assignments WHERE advogado_id = auth.uid() AND client_id = case_receipts.client_id))
  );

-- audit_log
CREATE POLICY "audit_log_select" ON audit_log FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'controller'));

CREATE POLICY "audit_log_insert" ON audit_log FOR INSERT
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'controller'));
