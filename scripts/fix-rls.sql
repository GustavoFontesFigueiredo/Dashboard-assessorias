-- ============================================================
-- CORREÇÃO DE RLS — resolve recursão nas políticas
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Função SECURITY DEFINER para buscar role sem acionar RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Remove todas as políticas antigas e recria corretamente

-- PROFILES
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
DROP POLICY IF EXISTS "profiles_read_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (auth.uid() = id OR get_my_role() = 'admin');

CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (auth.uid() = id OR get_my_role() = 'admin');

-- CLIENTS
DROP POLICY IF EXISTS "clients_select" ON clients;
DROP POLICY IF EXISTS "clients_insert" ON clients;
DROP POLICY IF EXISTS "clients_update" ON clients;
DROP POLICY IF EXISTS "clients_read_own_for_client" ON clients;
DROP POLICY IF EXISTS "clients_read_internal" ON clients;
DROP POLICY IF EXISTS "clients_update_admin" ON clients;
DROP POLICY IF EXISTS "clients_update_controller" ON clients;
DROP POLICY IF EXISTS "clients_insert_admin" ON clients;

CREATE POLICY "clients_select" ON clients FOR SELECT
  USING (
    get_my_role() IN ('admin', 'controller') OR
    (get_my_role() = 'advogado' AND
     EXISTS (SELECT 1 FROM lawyer_assignments WHERE advogado_id = auth.uid() AND client_id = id)) OR
    (get_my_role() = 'cliente' AND
     id = (SELECT client_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "clients_insert" ON clients FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'controller'));

CREATE POLICY "clients_update" ON clients FOR UPDATE
  USING (get_my_role() IN ('admin', 'controller'));

-- LAWYER_ASSIGNMENTS
DROP POLICY IF EXISTS "lawyer_assignments_select" ON lawyer_assignments;
DROP POLICY IF EXISTS "lawyer_assignments_insert" ON lawyer_assignments;
DROP POLICY IF EXISTS "lawyer_assignments_admin" ON lawyer_assignments;
DROP POLICY IF EXISTS "lawyer_assignments_controller" ON lawyer_assignments;
DROP POLICY IF EXISTS "lawyer_assignments_read_own" ON lawyer_assignments;

CREATE POLICY "lawyer_assignments_select" ON lawyer_assignments FOR SELECT
  USING (get_my_role() IN ('admin', 'controller') OR advogado_id = auth.uid());

CREATE POLICY "lawyer_assignments_insert" ON lawyer_assignments FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'controller'));

CREATE POLICY "lawyer_assignments_delete" ON lawyer_assignments FOR DELETE
  USING (get_my_role() IN ('admin', 'controller'));

-- CASES
DROP POLICY IF EXISTS "cases_select" ON cases;
DROP POLICY IF EXISTS "cases_insert" ON cases;
DROP POLICY IF EXISTS "cases_update" ON cases;
DROP POLICY IF EXISTS "cases_delete" ON cases;

CREATE POLICY "cases_select" ON cases FOR SELECT
  USING (
    get_my_role() IN ('admin', 'controller') OR
    (get_my_role() = 'advogado' AND
     EXISTS (SELECT 1 FROM lawyer_assignments WHERE advogado_id = auth.uid() AND client_id = cases.client_id)) OR
    (get_my_role() = 'cliente' AND
     client_id = (SELECT client_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "cases_insert" ON cases FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'controller', 'advogado'));

CREATE POLICY "cases_update" ON cases FOR UPDATE
  USING (get_my_role() IN ('admin', 'controller', 'advogado'));

CREATE POLICY "cases_delete" ON cases FOR DELETE
  USING (get_my_role() IN ('admin', 'controller'));

-- CASE_COSTS
DROP POLICY IF EXISTS "case_costs_select" ON case_costs;
DROP POLICY IF EXISTS "case_costs_insert" ON case_costs;
DROP POLICY IF EXISTS "case_costs_update" ON case_costs;
DROP POLICY IF EXISTS "case_costs_delete" ON case_costs;

CREATE POLICY "case_costs_select" ON case_costs FOR SELECT
  USING (
    get_my_role() IN ('admin', 'controller') OR
    (get_my_role() = 'advogado' AND
     EXISTS (SELECT 1 FROM lawyer_assignments WHERE advogado_id = auth.uid() AND client_id = case_costs.client_id)) OR
    (get_my_role() = 'cliente' AND
     client_id = (SELECT client_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "case_costs_insert" ON case_costs FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'controller', 'advogado'));

CREATE POLICY "case_costs_update" ON case_costs FOR UPDATE
  USING (get_my_role() IN ('admin', 'controller', 'advogado'));

CREATE POLICY "case_costs_delete" ON case_costs FOR DELETE
  USING (get_my_role() IN ('admin', 'controller'));

-- CASE_RECEIPTS
DROP POLICY IF EXISTS "case_receipts_select" ON case_receipts;
DROP POLICY IF EXISTS "case_receipts_insert" ON case_receipts;
DROP POLICY IF EXISTS "case_receipts_update" ON case_receipts;
DROP POLICY IF EXISTS "case_receipts_delete" ON case_receipts;

CREATE POLICY "case_receipts_select" ON case_receipts FOR SELECT
  USING (
    get_my_role() IN ('admin', 'controller') OR
    (get_my_role() = 'advogado' AND
     EXISTS (SELECT 1 FROM lawyer_assignments WHERE advogado_id = auth.uid() AND client_id = case_receipts.client_id)) OR
    (get_my_role() = 'cliente' AND
     client_id = (SELECT client_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "case_receipts_insert" ON case_receipts FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'controller', 'advogado'));

CREATE POLICY "case_receipts_update" ON case_receipts FOR UPDATE
  USING (get_my_role() IN ('admin', 'controller', 'advogado'));

CREATE POLICY "case_receipts_delete" ON case_receipts FOR DELETE
  USING (get_my_role() IN ('admin', 'controller'));

-- AUDIT_LOG
DROP POLICY IF EXISTS "audit_log_select" ON audit_log;
DROP POLICY IF EXISTS "audit_log_insert" ON audit_log;

CREATE POLICY "audit_log_select" ON audit_log FOR SELECT
  USING (get_my_role() IN ('admin', 'controller'));

CREATE POLICY "audit_log_insert" ON audit_log FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'controller'));

-- 3. Verificação — testa se a função retorna o role do admin
SELECT get_my_role() AS meu_role;
SELECT COUNT(*) AS total_clients FROM clients;
SELECT COUNT(*) AS total_cases FROM cases;
