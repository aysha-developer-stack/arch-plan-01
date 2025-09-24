-- Add missing RPC functions for download and view count increments

-- Function to increment plan download count
CREATE OR REPLACE FUNCTION increment_plan_download_count(plan_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE plans 
  SET download_count = download_count + 1,
      updated_at = NOW()
  WHERE id = plan_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment plan view count
CREATE OR REPLACE FUNCTION increment_plan_view_count(plan_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE plans 
  SET view_count = view_count + 1,
      updated_at = NOW()
  WHERE id = plan_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment user download count (if needed)
CREATE OR REPLACE FUNCTION increment_user_download_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- This function can be implemented if you have a user downloads tracking table
  -- For now, it's a placeholder
  NULL;
END;
$$ LANGUAGE plpgsql;