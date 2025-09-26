-- Migration to add images column to plans table
-- This migration adds the missing images column to store image metadata

ALTER TABLE plans ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Create an index on the images column for better performance
CREATE INDEX IF NOT EXISTS idx_plans_images ON plans USING GIN (images);

-- Update any existing plans to have an empty images array if they don't have one
UPDATE plans SET images = '[]'::jsonb WHERE images IS NULL;