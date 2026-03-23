-- Temporary fix for groups RLS policy
-- This makes the policy more permissive for testing

-- First, let's see if the existing policy is the problem
DROP POLICY IF EXISTS groups_insert ON groups;

-- Create a simpler policy that allows any authenticated user to create groups
CREATE POLICY groups_insert ON groups FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND auth.uid()::text = created_by::text
);
