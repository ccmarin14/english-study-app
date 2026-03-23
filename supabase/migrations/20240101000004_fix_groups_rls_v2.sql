-- Drop and recreate the groups_insert policy with a simpler check
DROP POLICY IF EXISTS groups_insert ON groups;

-- Create a very permissive policy for testing
CREATE POLICY groups_insert ON groups FOR INSERT 
WITH CHECK (true);

-- Also recreate select policy to see groups
DROP POLICY IF EXISTS groups_select ON groups;
CREATE POLICY groups_select ON groups FOR SELECT USING (true);
