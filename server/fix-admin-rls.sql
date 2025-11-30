-- Fix the RLS policies for the admins table
-- The issue is that there's no INSERT policy, creating a chicken-and-egg problem

-- Add INSERT policy for admins table
-- Option 1: Allow authenticated users to insert admin records (temporary)
CREATE POLICY admins_insert_authenticated ON admins
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Option 2: If you prefer, you can make it more restrictive
-- This would only allow users with admin metadata to insert
-- CREATE POLICY admins_insert_with_metadata ON admins
--   FOR INSERT
--   WITH CHECK (
--     auth.role() = 'authenticated' AND
--     (auth.jwt() ->> 'user_metadata' ->> 'is_admin')::boolean = true
--   );

-- Option 3: Most secure - only existing admins can create new admins
-- But this won't work for the first admin, so we'll use Option 1 for now
-- CREATE POLICY admins_insert_admin_only ON admins
--   FOR INSERT
--   WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Also add UPDATE and DELETE policies for completeness
CREATE POLICY admins_update_admin ON admins
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY admins_delete_admin ON admins
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));