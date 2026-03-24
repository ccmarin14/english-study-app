-- Drop all session_turns policies
DROP POLICY IF EXISTS st_all ON session_turns;
DROP POLICY IF EXISTS st_select ON session_turns;
DROP POLICY IF EXISTS st_insert ON session_turns;
DROP POLICY IF EXISTS st_update ON session_turns;
DROP POLICY IF EXISTS st_delete ON session_turns;

-- Create simple permissive policy for testing
CREATE POLICY st_select ON session_turns FOR SELECT USING (true);
CREATE POLICY st_insert ON session_turns FOR INSERT WITH CHECK (true);
CREATE POLICY st_update ON session_turns FOR UPDATE USING (true);
CREATE POLICY st_delete ON session_turns FOR DELETE USING (true);
