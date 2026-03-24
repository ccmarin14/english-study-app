-- Create a function to bypass RLS for session_turns
CREATE OR REPLACE FUNCTION get_session_turns(p_session_id UUID)
RETURNS SETOF session_turns
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM session_turns
  WHERE session_id = p_session_id AND status = 'active'
  LIMIT 1;
END;
$$;

-- Also make sure session_attempts and other session tables are accessible
DO $$
DECLARE
    p RECORD;
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'session_%' LOOP
        FOR p IN SELECT policyname FROM pg_policies WHERE tablename = tbl LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', p.policyname, tbl);
        END LOOP;
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY;', tbl);
    END LOOP;
END $$;
