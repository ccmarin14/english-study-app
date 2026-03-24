-- Fix session_turns RLS policy
-- The issue is that is_session_member may not be evaluating correctly

-- Drop the problematic policy
DROP POLICY IF EXISTS st_all ON session_turns;

-- Create a simpler policy that checks directly
CREATE POLICY st_all ON session_turns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_sessions gs
    JOIN group_members gm ON gm.group_id = gs.group_id
    WHERE gs.id = session_turns.session_id 
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY st_insert ON session_turns FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_sessions gs
    JOIN group_members gm ON gm.group_id = gs.group_id
    WHERE gs.id = session_turns.session_id 
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY st_update ON session_turns FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM group_sessions gs
    JOIN group_members gm ON gm.group_id = gs.group_id
    WHERE gs.id = session_turns.session_id 
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY st_delete ON session_turns FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM group_sessions gs
    JOIN group_members gm ON gm.group_id = gs.group_id
    WHERE gs.id = session_turns.session_id 
    AND gm.user_id = auth.uid()
  )
);
