-- Add single plotLength column to replace plotLengthMin/Max
-- This migration adds the plotLength column that the frontend expects

ALTER TABLE plans ADD COLUMN IF NOT EXISTS plotLength DECIMAL(10,3);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_plans_plotLength ON plans (plotLength);

-- Optional: If you want to migrate data from plotLengthMin to plotLength
-- UPDATE plans SET plotLength = plotLengthMin WHERE plotLengthMin IS NOT NULL AND plotLength IS NULL;