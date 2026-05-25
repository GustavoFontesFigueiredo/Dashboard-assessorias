-- ============================================================
-- MIGRACAO: Atas quinzenais integradas ao FFADV-OS
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Atas por advogado responsavel
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  responsavel_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  meeting_date DATE NOT NULL,
  due_at TIMESTAMPTZ,
  scope TEXT,
  participants TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'prepared', 'in_progress', 'completed', 'published', 'cancelled')
  ),
  timebox_minutes INT NOT NULL DEFAULT 40 CHECK (timebox_minutes BETWEEN 30 AND 50),
  portfolio_snapshot_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  agenda_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  minutes_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meeting_minutes_responsavel
  ON meeting_minutes(responsavel_id, meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_status
  ON meeting_minutes(status);

-- 2. Categorias de decisao em bloco
CREATE TABLE IF NOT EXISTS meeting_minute_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_minute_id UUID NOT NULL REFERENCES meeting_minutes(id) ON DELETE CASCADE,
  category_key TEXT NOT NULL,
  title TEXT NOT NULL,
  items_count INT NOT NULL DEFAULT 0,
  items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  decision_mode TEXT NOT NULL DEFAULT 'block' CHECK (
    decision_mode IN ('block', 'partial', 'individual', 'skip')
  ),
  decision_text TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meeting_minute_categories_minute
  ON meeting_minute_categories(meeting_minute_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_meeting_minute_categories_key
  ON meeting_minute_categories(meeting_minute_id, category_key);

-- 3. Casos destacados para analise pormenorizada
CREATE TABLE IF NOT EXISTS meeting_minute_spotlight_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_minute_id UUID NOT NULL REFERENCES meeting_minutes(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  discussion_notes TEXT,
  decision_text TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meeting_minute_spotlights_minute
  ON meeting_minute_spotlight_items(meeting_minute_id);

-- 4. Tarefas originadas da ata
CREATE TABLE IF NOT EXISTS meeting_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_minute_id UUID NOT NULL REFERENCES meeting_minutes(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  category_id UUID REFERENCES meeting_minute_categories(id) ON DELETE SET NULL,
  spotlight_item_id UUID REFERENCES meeting_minute_spotlight_items(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'cancelled')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (
    source IN ('manual', 'block_decision', 'spotlight_decision', 'future_transcription_ai')
  ),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_meeting_tasks_minute
  ON meeting_tasks(meeting_minute_id);
CREATE INDEX IF NOT EXISTS idx_meeting_tasks_owner_status
  ON meeting_tasks(owner_id, status);

-- 5. updated_at automatico
CREATE OR REPLACE FUNCTION update_meeting_minutes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $mm_updated_at$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$mm_updated_at$;

DROP TRIGGER IF EXISTS trg_meeting_minutes_updated_at ON meeting_minutes;
CREATE TRIGGER trg_meeting_minutes_updated_at
  BEFORE UPDATE ON meeting_minutes
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_minutes_updated_at();

-- 6. Helpers de acesso para policies filhas
CREATE OR REPLACE FUNCTION can_access_meeting_minute(p_minute_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $mm_can_access$
DECLARE
  v_role TEXT;
  v_uid UUID;
BEGIN
  v_role := get_my_role();
  v_uid := auth.uid();

  IF v_role IN ('admin', 'controller') THEN
    RETURN TRUE;
  END IF;

  IF v_role = 'advogado' THEN
    RETURN EXISTS (
      SELECT 1
      FROM meeting_minutes mm
      WHERE mm.id = p_minute_id
        AND mm.responsavel_id = v_uid
    );
  END IF;

  RETURN FALSE;
END;
$mm_can_access$;

CREATE OR REPLACE FUNCTION can_edit_meeting_minute(p_minute_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $mm_can_edit$
DECLARE
  v_role TEXT;
  v_uid UUID;
BEGIN
  v_role := get_my_role();
  v_uid := auth.uid();

  IF v_role IN ('admin', 'controller') THEN
    RETURN TRUE;
  END IF;

  IF v_role = 'advogado' THEN
    RETURN EXISTS (
      SELECT 1
      FROM meeting_minutes mm
      WHERE mm.id = p_minute_id
        AND mm.responsavel_id = v_uid
        AND mm.status <> 'published'
    );
  END IF;

  RETURN FALSE;
END;
$mm_can_edit$;

-- 7. RLS
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minute_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minute_spotlight_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meeting_minutes_select" ON meeting_minutes;
CREATE POLICY "meeting_minutes_select" ON meeting_minutes FOR SELECT
  USING (
    get_my_role() IN ('admin', 'controller') OR
    (get_my_role() = 'advogado' AND responsavel_id = auth.uid())
  );

DROP POLICY IF EXISTS "meeting_minutes_insert" ON meeting_minutes;
CREATE POLICY "meeting_minutes_insert" ON meeting_minutes FOR INSERT
  WITH CHECK (
    get_my_role() IN ('admin', 'controller') OR
    (get_my_role() = 'advogado' AND responsavel_id = auth.uid())
  );

DROP POLICY IF EXISTS "meeting_minutes_update" ON meeting_minutes;
CREATE POLICY "meeting_minutes_update" ON meeting_minutes FOR UPDATE
  USING (
    get_my_role() IN ('admin', 'controller') OR
    (get_my_role() = 'advogado' AND responsavel_id = auth.uid() AND status <> 'published')
  )
  WITH CHECK (
    get_my_role() IN ('admin', 'controller') OR
    (get_my_role() = 'advogado' AND responsavel_id = auth.uid())
  );

DROP POLICY IF EXISTS "meeting_minutes_delete" ON meeting_minutes;
CREATE POLICY "meeting_minutes_delete" ON meeting_minutes FOR DELETE
  USING (get_my_role() IN ('admin', 'controller'));

DROP POLICY IF EXISTS "meeting_categories_select" ON meeting_minute_categories;
CREATE POLICY "meeting_categories_select" ON meeting_minute_categories FOR SELECT
  USING (can_access_meeting_minute(meeting_minute_id));

DROP POLICY IF EXISTS "meeting_categories_insert" ON meeting_minute_categories;
CREATE POLICY "meeting_categories_insert" ON meeting_minute_categories FOR INSERT
  WITH CHECK (can_edit_meeting_minute(meeting_minute_id));

DROP POLICY IF EXISTS "meeting_categories_update" ON meeting_minute_categories;
CREATE POLICY "meeting_categories_update" ON meeting_minute_categories FOR UPDATE
  USING (can_edit_meeting_minute(meeting_minute_id))
  WITH CHECK (can_edit_meeting_minute(meeting_minute_id));

DROP POLICY IF EXISTS "meeting_spotlights_select" ON meeting_minute_spotlight_items;
CREATE POLICY "meeting_spotlights_select" ON meeting_minute_spotlight_items FOR SELECT
  USING (can_access_meeting_minute(meeting_minute_id));

DROP POLICY IF EXISTS "meeting_spotlights_insert" ON meeting_minute_spotlight_items;
CREATE POLICY "meeting_spotlights_insert" ON meeting_minute_spotlight_items FOR INSERT
  WITH CHECK (can_edit_meeting_minute(meeting_minute_id));

DROP POLICY IF EXISTS "meeting_spotlights_update" ON meeting_minute_spotlight_items;
CREATE POLICY "meeting_spotlights_update" ON meeting_minute_spotlight_items FOR UPDATE
  USING (can_edit_meeting_minute(meeting_minute_id))
  WITH CHECK (can_edit_meeting_minute(meeting_minute_id));

DROP POLICY IF EXISTS "meeting_tasks_select" ON meeting_tasks;
CREATE POLICY "meeting_tasks_select" ON meeting_tasks FOR SELECT
  USING (can_access_meeting_minute(meeting_minute_id));

DROP POLICY IF EXISTS "meeting_tasks_insert" ON meeting_tasks;
CREATE POLICY "meeting_tasks_insert" ON meeting_tasks FOR INSERT
  WITH CHECK (can_edit_meeting_minute(meeting_minute_id));

DROP POLICY IF EXISTS "meeting_tasks_update" ON meeting_tasks;
CREATE POLICY "meeting_tasks_update" ON meeting_tasks FOR UPDATE
  USING (can_edit_meeting_minute(meeting_minute_id))
  WITH CHECK (can_edit_meeting_minute(meeting_minute_id));

-- Verificacao
SELECT 'meeting_minutes' AS tabela, COUNT(*) FROM meeting_minutes
UNION ALL
SELECT 'meeting_minute_categories', COUNT(*) FROM meeting_minute_categories
UNION ALL
SELECT 'meeting_minute_spotlight_items', COUNT(*) FROM meeting_minute_spotlight_items
UNION ALL
SELECT 'meeting_tasks', COUNT(*) FROM meeting_tasks;
