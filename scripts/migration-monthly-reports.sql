-- ============================================================
-- MIGRAÇÃO: monthly_reports (Fase 3 — Relatório mensal automático)
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  referencia TEXT NOT NULL,           -- "2026-04", "2026-05" etc.
  narrativa_ai TEXT,                  -- Resumo narrativo gerado pela IA
  arquivo_url TEXT,                   -- URL do PDF no Supabase Storage
  arquivo_nome TEXT,                  -- Nome do arquivo para download
  generated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca por cliente + mês (mais recente primeiro)
CREATE INDEX IF NOT EXISTS idx_monthly_reports_client
  ON monthly_reports(client_id, referencia DESC);

-- Impedir duplicatas (um relatório por cliente por mês)
CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_reports_unique
  ON monthly_reports(client_id, referencia);

ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "monthly_reports_select" ON monthly_reports;
DROP POLICY IF EXISTS "monthly_reports_insert" ON monthly_reports;
DROP POLICY IF EXISTS "monthly_reports_delete" ON monthly_reports;

-- Cliente vê apenas seus relatórios; admin/controller veem tudo
CREATE POLICY "monthly_reports_select" ON monthly_reports FOR SELECT
  USING (
    get_my_role() IN ('admin', 'controller') OR
    (get_my_role() = 'cliente' AND
     client_id = (SELECT client_id FROM profiles WHERE id = auth.uid()))
  );

-- Apenas admin/controller podem inserir (geração de relatório)
CREATE POLICY "monthly_reports_insert" ON monthly_reports FOR INSERT
  WITH CHECK (
    get_my_role() IN ('admin', 'controller')
  );

-- Apenas admin/controller podem deletar
CREATE POLICY "monthly_reports_delete" ON monthly_reports FOR DELETE
  USING (
    get_my_role() IN ('admin', 'controller')
  );

-- ============================================================
-- STORAGE: Bucket para relatórios PDF
-- Execute separadamente se preferir criar via dashboard
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "reports_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "reports_storage_insert" ON storage.objects;

-- Política de leitura: admin/controller leem tudo, cliente lê só seus
CREATE POLICY "reports_storage_select" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'reports' AND (
      get_my_role() IN ('admin', 'controller') OR
      (get_my_role() = 'cliente' AND
       (storage.foldername(name))[1] = (SELECT client_id::text FROM profiles WHERE id = auth.uid()))
    )
  );

-- Política de inserção: apenas admin/controller
CREATE POLICY "reports_storage_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'reports' AND
    get_my_role() IN ('admin', 'controller')
  );

SELECT 'monthly_reports + storage criados' AS resultado;
