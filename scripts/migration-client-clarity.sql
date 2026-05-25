-- ============================================================
-- MIGRACAO: client_next_steps (Portal v2 - Central de clareza)
-- Execute no SQL Editor do Supabase
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'next_step_status') THEN
    CREATE TYPE next_step_status AS ENUM (
      'pendente',
      'em_andamento',
      'aguardando_cliente',
      'concluido',
      'cancelado'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS client_next_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date DATE,
  status next_step_status NOT NULL DEFAULT 'pendente',
  visible_to_client BOOLEAN NOT NULL DEFAULT true,
  source_update_id UUID REFERENCES case_updates(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_next_steps_client
  ON client_next_steps(client_id, status, due_date);

CREATE INDEX IF NOT EXISTS idx_client_next_steps_case
  ON client_next_steps(case_id);

CREATE INDEX IF NOT EXISTS idx_client_next_steps_owner
  ON client_next_steps(owner_id);

CREATE OR REPLACE FUNCTION public.set_client_next_steps_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_client_next_steps_updated_at ON client_next_steps;
CREATE TRIGGER trg_client_next_steps_updated_at
BEFORE UPDATE ON client_next_steps
FOR EACH ROW
EXECUTE FUNCTION public.set_client_next_steps_updated_at();

ALTER TABLE client_next_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_next_steps_select" ON client_next_steps;
DROP POLICY IF EXISTS "client_next_steps_insert" ON client_next_steps;
DROP POLICY IF EXISTS "client_next_steps_update" ON client_next_steps;
DROP POLICY IF EXISTS "client_next_steps_delete" ON client_next_steps;

CREATE POLICY "client_next_steps_select" ON client_next_steps FOR SELECT
  USING (
    get_my_role() IN ('admin', 'controller') OR
    (
      get_my_role() = 'advogado' AND
      EXISTS (
        SELECT 1
        FROM lawyer_assignments
        WHERE advogado_id = auth.uid()
          AND client_id = client_next_steps.client_id
      )
    ) OR
    (
      get_my_role() = 'cliente' AND
      visible_to_client = true AND
      client_id = (SELECT client_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "client_next_steps_insert" ON client_next_steps FOR INSERT
  WITH CHECK (
    get_my_role() IN ('admin', 'controller') OR
    (
      get_my_role() = 'advogado' AND
      EXISTS (
        SELECT 1
        FROM lawyer_assignments
        WHERE advogado_id = auth.uid()
          AND client_id = client_next_steps.client_id
      )
    )
  );

CREATE POLICY "client_next_steps_update" ON client_next_steps FOR UPDATE
  USING (
    get_my_role() IN ('admin', 'controller') OR
    (
      get_my_role() = 'advogado' AND
      EXISTS (
        SELECT 1
        FROM lawyer_assignments
        WHERE advogado_id = auth.uid()
          AND client_id = client_next_steps.client_id
      )
    )
  );

CREATE POLICY "client_next_steps_delete" ON client_next_steps FOR DELETE
  USING (get_my_role() IN ('admin', 'controller'));

-- Verificacao
SELECT 'client_next_steps criada' AS resultado, COUNT(*) AS total
FROM client_next_steps;
