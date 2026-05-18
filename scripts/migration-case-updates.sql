-- ============================================================
-- MIGRAÇÃO: case_updates + ai_summaries
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Timeline de atualizações de processos
CREATE TABLE IF NOT EXISTS case_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  tipo TEXT NOT NULL CHECK (tipo IN (
    'status_change', 'fase_change', 'valor_change', 'observacao', 'documento', 'audiencia'
  )),
  descricao_tecnica TEXT NOT NULL,
  narrativa_ai TEXT,
  dados_alteracao JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_case_updates_case ON case_updates(case_id);
CREATE INDEX IF NOT EXISTS idx_case_updates_client ON case_updates(client_id);
CREATE INDEX IF NOT EXISTS idx_case_updates_created ON case_updates(created_at DESC);

-- RLS
ALTER TABLE case_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "case_updates_select" ON case_updates FOR SELECT
  USING (
    get_my_role() IN ('admin', 'controller') OR
    (get_my_role() = 'advogado' AND
     EXISTS (SELECT 1 FROM lawyer_assignments WHERE advogado_id = auth.uid() AND client_id = case_updates.client_id)) OR
    (get_my_role() = 'cliente' AND
     client_id = (SELECT client_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "case_updates_insert" ON case_updates FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'controller', 'advogado'));

CREATE POLICY "case_updates_update" ON case_updates FOR UPDATE
  USING (get_my_role() IN ('admin', 'controller', 'advogado'));

-- 2. Cache de resumos AI (narrativas mensais, insights)
CREATE TABLE IF NOT EXISTS ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('resumo_mensal', 'insight', 'relatorio')),
  periodo TEXT,
  conteudo TEXT NOT NULL,
  destinatario_id UUID REFERENCES profiles(id),
  lido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_summaries_client ON ai_summaries(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_dest ON ai_summaries(destinatario_id);

ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_summaries_select" ON ai_summaries FOR SELECT
  USING (
    get_my_role() IN ('admin', 'controller') OR
    destinatario_id = auth.uid() OR
    (get_my_role() = 'cliente' AND
     client_id = (SELECT client_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "ai_summaries_insert" ON ai_summaries FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'controller', 'advogado'));

CREATE POLICY "ai_summaries_update" ON ai_summaries FOR UPDATE
  USING (get_my_role() IN ('admin', 'controller') OR destinatario_id = auth.uid());

-- Verificação
SELECT 'case_updates' AS tabela, COUNT(*) FROM case_updates
UNION ALL
SELECT 'ai_summaries', COUNT(*) FROM ai_summaries;
