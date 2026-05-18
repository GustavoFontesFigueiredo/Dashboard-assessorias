-- Permite que admin e controller excluam atualizações da timeline
DROP POLICY IF EXISTS "case_updates_delete" ON case_updates;
CREATE POLICY "case_updates_delete" ON case_updates FOR DELETE
  USING (get_my_role() IN ('admin', 'controller'));
