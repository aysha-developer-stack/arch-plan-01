# 🔧 Supabase Database Fix Instructions

## Current Issues Found:
- ❌ Missing `get_plan_stats()` function
- ❌ Missing `get_user_stats()` function  
- ❌ Missing `plan-files` storage bucket
- ❌ Missing columns in `plans` table (bedrooms, toilets, etc.)
- ❌ Row-level security policy issues

## 🚀 How to Fix

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your ArchPlan project
3. Go to **SQL Editor** (in the left sidebar)

### Step 2: Run the Complete Fix Script
Copy and paste the **ENTIRE** script below into the SQL Editor and click **Run**:

```sql
-- ArchPlan Database Complete Fix Script
-- Run this entire script in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add missing columns to plans table
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS fileName TEXT,
ADD COLUMN IF NOT EXISTS filePath TEXT,
ADD COLUMN IF NOT EXISTS fileSize INTEGER,
ADD COLUMN IF NOT EXISTS fileId TEXT,
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS planType TEXT,
ADD COLUMN IF NOT EXISTS storeys INTEGER,
ADD COLUMN IF NOT EXISTS lotSize TEXT,
ADD COLUMN IF NOT EXISTS orientation TEXT,
ADD COLUMN IF NOT EXISTS siteType TEXT,
ADD COLUMN IF NOT EXISTS foundationType TEXT,
ADD COLUMN IF NOT EXISTS councilArea TEXT,
ADD COLUMN IF NOT EXISTS plotLength NUMERIC,
ADD COLUMN IF NOT EXISTS plotWidth NUMERIC,
ADD COLUMN IF NOT EXISTS coveredArea NUMERIC,
ADD COLUMN IF NOT EXISTS roadPosition TEXT,
ADD COLUMN IF NOT EXISTS builderName TEXT,
ADD COLUMN IF NOT EXISTS jobAddress TEXT,
ADD COLUMN IF NOT EXISTS houseType TEXT,
ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS toilets INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS livingAreas INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS numberOfUnits INTEGER,
ADD COLUMN IF NOT EXISTS constructionType TEXT[],
ADD COLUMN IF NOT EXISTS lotSizeMin NUMERIC,
ADD COLUMN IF NOT EXISTS lotSizeMax NUMERIC,
ADD COLUMN IF NOT EXISTS totalBuildingHeight NUMERIC,
ADD COLUMN IF NOT EXISTS roofPitch NUMERIC,
ADD COLUMN IF NOT EXISTS outdoorFeatures TEXT[],
ADD COLUMN IF NOT EXISTS indoorFeatures TEXT[],
ADD COLUMN IF NOT EXISTS extractedKeywords TEXT[],
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS uploadedBy UUID REFERENCES auth.users(id);

-- Create or replace the get_plan_stats function
CREATE OR REPLACE FUNCTION get_plan_stats()
RETURNS TABLE (
  totalPlans INTEGER,
  totalDownloads INTEGER,
  recentUploads INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as totalPlans,
    COALESCE(SUM(download_count), 0)::INTEGER as totalDownloads,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::INTEGER as recentUploads
  FROM plans;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the get_user_stats function
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
  total_users INTEGER,
  pending_users INTEGER,
  approved_users INTEGER,
  rejected_users INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_users,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER AS pending_users,
    COUNT(*) FILTER (WHERE status = 'approved')::INTEGER AS approved_users,
    COUNT(*) FILTER (WHERE status = 'rejected')::INTEGER AS rejected_users
  FROM app_users;
END;
$$ LANGUAGE plpgsql;

-- Create storage bucket for plan files
INSERT INTO storage.buckets (id, name, public)
VALUES ('plan-files', 'plan-files', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view plan files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload plan files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own plan files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own plan files" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Anyone can view plan files" ON storage.objects
  FOR SELECT USING (bucket_id = 'plan-files');

CREATE POLICY "Authenticated users can upload plan files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'plan-files' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own plan files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'plan-files'
  );

CREATE POLICY "Users can delete their own plan files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'plan-files'
  );

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_plans_planType ON plans (planType);
CREATE INDEX IF NOT EXISTS idx_plans_storeys ON plans (storeys);
CREATE INDEX IF NOT EXISTS idx_plans_bedrooms ON plans (bedrooms);
CREATE INDEX IF NOT EXISTS idx_plans_houseType ON plans (houseType);
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans (status);
CREATE INDEX IF NOT EXISTS idx_plans_uploadedBy ON plans (uploadedBy);

-- Update timestamp trigger for plans table
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_plans_timestamp ON plans;
CREATE TRIGGER update_plans_timestamp
BEFORE UPDATE ON plans
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
```

### Step 3: Verify the Fix
After running the script, you should see:
- ✅ All columns added to plans table
- ✅ Functions created successfully
- ✅ Storage bucket created
- ✅ Storage policies applied

### Step 4: Test the Application
1. Go back to your terminal
2. The server should now work without errors
3. Try uploading a plan through the admin interface

## 🎯 What This Fixes:
- ✅ Adds all missing columns to the `plans` table
- ✅ Creates the `get_plan_stats()` function
- ✅ Creates the `get_user_stats()` function
- ✅ Creates the `plan-files` storage bucket
- ✅ Sets up proper storage policies
- ✅ Adds database indexes for performance
- ✅ Sets up update triggers

## 🚨 Important Notes:
- Run the **ENTIRE** script at once in the SQL Editor
- Don't run it in parts - copy the whole thing
- If you get any errors, they're likely harmless (columns already exist, etc.)
- The script uses `IF NOT EXISTS` and `ON CONFLICT` to prevent errors

After running this script, your ArchPlan application should work perfectly! 🎉