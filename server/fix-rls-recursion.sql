-- Drop the problematic policy
DROP POLICY IF EXISTS admins_select_admin ON admins;

-- Create a new policy that avoids recursion by using auth.users metadata directly
CREATE POLICY admins_select_admin ON admins
  FOR SELECT
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'));