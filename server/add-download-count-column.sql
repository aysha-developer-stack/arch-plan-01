-- Add download_count column to app_users table
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

-- Update existing users to have a default download count of 0
UPDATE app_users 
SET download_count = 0 
WHERE download_count IS NULL;

-- Add a comment to document the column
COMMENT ON COLUMN app_users.download_count IS 'Number of plans downloaded by the user';