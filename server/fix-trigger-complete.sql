-- =====================================================
-- COMPREHENSIVE DATABASE TRIGGER FIX
-- This script will fix the auth user trigger issue
-- =====================================================

-- Step 1: Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON public.app_users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Ensure app_users table has correct structure
-- First, check if table exists and create/modify as needed
DO $$
BEGIN
    -- Create app_users table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_users') THEN
        CREATE TABLE public.app_users (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email TEXT,
            name TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_users' AND column_name = 'name') THEN
        ALTER TABLE public.app_users ADD COLUMN name TEXT;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_users' AND column_name = 'status') THEN
        ALTER TABLE public.app_users ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_users' AND column_name = 'created_at') THEN
        ALTER TABLE public.app_users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_users' AND column_name = 'updated_at') THEN
        ALTER TABLE public.app_users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Handle rejection_reason column - make it nullable if it exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_users' AND column_name = 'rejection_reason') THEN
        ALTER TABLE public.app_users ALTER COLUMN rejection_reason DROP NOT NULL;
    END IF;

    -- Handle other potentially problematic columns
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_users' AND column_name = 'approved_by') THEN
        ALTER TABLE public.app_users ALTER COLUMN approved_by DROP NOT NULL;
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_users' AND column_name = 'approved_at') THEN
        ALTER TABLE public.app_users ALTER COLUMN approved_at DROP NOT NULL;
    END IF;
END $$;

-- Step 3: Create the trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert new user into app_users table
    INSERT INTO public.app_users (id, email, name, status, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'pending',
        NOW(),
        NOW()
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth process
        RAISE WARNING 'Failed to create app_users record for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Step 4: Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Set up RLS policies for app_users table
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.app_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.app_users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.app_users;
DROP POLICY IF EXISTS "Allow trigger to insert new users" ON public.app_users;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own profile" ON public.app_users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.app_users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all users" ON public.app_users
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        OR auth.jwt()->>'role' = 'service_role'
    );

-- Critical: Allow the trigger function to insert new users
CREATE POLICY "Allow trigger to insert new users" ON public.app_users
    FOR INSERT WITH CHECK (true);

-- Step 6: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.app_users TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.app_users TO authenticated;

-- Step 7: Backfill existing auth users into app_users table
INSERT INTO public.app_users (id, email, name, status, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as name,
    'pending' as status,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.app_users apu ON au.id = apu.id
WHERE apu.id IS NULL;

-- Step 8: Create a test function to verify the trigger works
CREATE OR REPLACE FUNCTION public.test_trigger_functionality()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_count INTEGER;
    app_count INTEGER;
    result_text TEXT;
BEGIN
    -- Count users in both tables
    SELECT COUNT(*) INTO auth_count FROM auth.users;
    SELECT COUNT(*) INTO app_count FROM public.app_users;
    
    result_text := format('Auth users: %s, App users: %s', auth_count, app_count);
    
    IF auth_count = app_count THEN
        result_text := result_text || ' - ✅ TRIGGER IS WORKING!';
    ELSE
        result_text := result_text || ' - ❌ TRIGGER NOT WORKING!';
    END IF;
    
    RETURN result_text;
END;
$$;

-- Final verification
SELECT public.test_trigger_functionality() as trigger_status;

-- Show current state
SELECT 
    'Auth Users' as table_name, 
    COUNT(*) as count 
FROM auth.users
UNION ALL
SELECT 
    'App Users' as table_name, 
    COUNT(*) as count 
FROM public.app_users;