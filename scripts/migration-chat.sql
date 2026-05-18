-- ============================================================
-- MIGRAÇÃO: chat_messages (Fase 2 — Chat AI no portal)
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_client ON chat_messages(client_id, created_at);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Cliente vê apenas suas mensagens; admin/controller veem tudo
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT
  USING (
    get_my_role() IN ('admin', 'controller') OR
    (get_my_role() = 'cliente' AND
     client_id = (SELECT client_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT
  WITH CHECK (
    get_my_role() IN ('admin', 'controller') OR
    (get_my_role() = 'cliente' AND
     client_id = (SELECT client_id FROM profiles WHERE id = auth.uid()))
  );

SELECT 'chat_messages criada' AS resultado;
