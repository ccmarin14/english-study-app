-- Drop ALL policies for session_turns
DO $$
DECLARE
    p RECORD;
BEGIN
    FOR p IN SELECT policyname FROM pg_policies WHERE tablename = 'session_turns' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON session_turns;', p.policyname);
    END LOOP;
END $$;

-- Create completely permissive policies
CREATE POLICY session_turns_all ON session_turns FOR ALL USING (true) WITH CHECK (true);
