-- Temporarily disable RLS on the admins table to fix the infinite recursion issue
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on the admins table
DROP POLICY IF EXISTS admins_select_admin ON admins;
DROP POLICY IF EXISTS admins_insert_authenticated ON admins;
DROP POLICY IF EXISTS admins_update_admin ON admins;
DROP POLICY IF EXISTS admins_delete_admin ON admins;

-- Create a simple policy that doesn't cause recursion
CREATE POLICY admins_select_all ON admins
  FOR SELECT
  USING (true);

CREATE POLICY admins_insert_all ON admins
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY admins_update_all ON admins
  FOR UPDATE
  USING (true);

CREATE POLICY admins_delete_all ON admins
  FOR DELETE
  USING (true);

-- Re-enable RLS with the new policies
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;