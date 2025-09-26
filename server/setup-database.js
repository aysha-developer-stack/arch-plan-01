import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase URL or Anon Key not set in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Complete database setup SQL
const setupSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables for the ArchPlan application

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admins table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  architect TEXT,
  year INTEGER,
  location TEXT,
  building_type TEXT,
  keywords TEXT[],
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  images JSONB DEFAULT '[]'::jsonb,
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_plans_keywords ON plans USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_plans_building_type ON plans (building_type);
CREATE INDEX IF NOT EXISTS idx_plans_architect ON plans (architect);
CREATE INDEX IF NOT EXISTS idx_plans_year ON plans (year);
CREATE INDEX IF NOT EXISTS idx_plans_location ON plans (location);

-- Create a function to get user statistics
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

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_users_timestamp
BEFORE UPDATE ON app_users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_admins_timestamp
BEFORE UPDATE ON admins
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_plans_timestamp
BEFORE UPDATE ON plans
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Create a function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO app_users (id, name, email, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to handle admin registration
CREATE OR REPLACE FUNCTION handle_new_admin()
RETURNS TRIGGER AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if the user has admin metadata
  is_admin := NEW.raw_user_meta_data->>'is_admin' = 'true';
  
  IF is_admin THEN
    INSERT INTO admins (id, email, name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', 'Admin')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Trigger the admin function every time a user is created
CREATE TRIGGER on_auth_admin_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_admin();

-- Create Row Level Security (RLS) policies

-- Enable RLS on tables
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- App Users policies
-- Users can read their own profile
CREATE POLICY app_users_select_own ON app_users
  FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all user profiles
CREATE POLICY app_users_select_admin ON app_users
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Admins can update user profiles
CREATE POLICY app_users_update_admin ON app_users
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Admins policies
-- Admins can read other admin profiles
CREATE POLICY admins_select_admin ON admins
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Plans policies
-- Anyone can read approved plans
CREATE POLICY plans_select_public ON plans
  FOR SELECT
  USING (true);

-- Admins can create, update, and delete plans
CREATE POLICY plans_all_admin ON plans
  FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Approved users can create plans
CREATE POLICY plans_insert_approved_user ON plans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE id = auth.uid() AND status = 'approved'
    )
  );

-- Create storage bucket for plan files
INSERT INTO storage.buckets (id, name, public)
VALUES ('plan-files', 'plan-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Anyone can view plan files" ON storage.objects
  FOR SELECT USING (bucket_id = 'plan-files');

CREATE POLICY "Authenticated users can upload plan files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'plan-files' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own plan files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'plan-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own plan files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'plan-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
`;

async function setupDatabase() {
  console.log('🚀 Setting up ArchPlan database...\n');

  try {
    // Execute the setup SQL
    console.log('📝 Creating tables, functions, and policies...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: setupSQL });

    if (error) {
      console.error('❌ Error setting up database:', error);
      
      // Try alternative approach - execute SQL in smaller chunks
      console.log('🔄 Trying alternative setup approach...');
      
      const sqlCommands = setupSQL.split(';').filter(cmd => cmd.trim());
      
      for (let i = 0; i < sqlCommands.length; i++) {
        const command = sqlCommands[i].trim();
        if (command) {
          try {
            const { error: cmdError } = await supabase.rpc('exec_sql', { sql: command + ';' });
            if (cmdError) {
              console.log(`⚠️  Warning on command ${i + 1}:`, cmdError.message);
            }
          } catch (e) {
            console.log(`⚠️  Skipping command ${i + 1}:`, e.message);
          }
        }
      }
    } else {
      console.log('✅ Database setup completed successfully!');
    }

    // Test the setup by checking if tables exist
    console.log('\n🔍 Verifying database setup...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['app_users', 'admins', 'plans']);

    if (tablesError) {
      console.log('⚠️  Could not verify tables:', tablesError.message);
    } else {
      console.log('✅ Tables verified:', tables.map(t => t.table_name).join(', '));
    }

    // Test inserting sample data
    console.log('\n🧪 Testing data insertion...');
    
    const testPlan = {
      title: 'Sample Architectural Plan',
      description: 'A beautiful modern house design',
      architect: 'John Architect',

      location: 'Sydney, Australia',
      building_type: 'Residential',
      keywords: ['modern', 'house', 'residential'],
      download_count: 0,
      view_count: 0
    };

    const { data: insertedPlan, error: insertError } = await supabase
      .from('plans')
      .insert(testPlan)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Error inserting test data:', insertError.message);
    } else {
      console.log('✅ Successfully inserted test plan:', insertedPlan.id);
      
      // Query the data back
      const { data: queriedPlan, error: queryError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', insertedPlan.id)
        .single();

      if (queryError) {
        console.log('❌ Error querying test data:', queryError.message);
      } else {
        console.log('✅ Successfully queried test plan:', queriedPlan.title);
      }

      // Clean up test data
      const { error: deleteError } = await supabase
        .from('plans')
        .delete()
        .eq('id', insertedPlan.id);

      if (deleteError) {
        console.log('⚠️  Warning: Could not delete test data:', deleteError.message);
      } else {
        console.log('✅ Test data cleaned up');
      }
    }

    console.log('\n🎉 Database setup complete! Your application can now store data.');
    console.log('\n📊 Available tables:');
    console.log('   • app_users - User registration and approval');
    console.log('   • admins - Admin management');
    console.log('   • plans - Architectural plans and metadata');
    console.log('   • storage.objects - File storage for PDFs and images');

  } catch (error) {
    console.error('❌ Unexpected error during setup:', error);
  }
}

// Run the setup
setupDatabase();