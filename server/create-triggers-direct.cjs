const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(
  'https://zxevebnmhikhdszwtiqk.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false }
  }
);

async function createTriggers() {
  console.log('🔧 Creating database triggers programmatically...');
  
  try {
    // First, let's check if the app_users table exists
    const { data: tables, error: tableError } = await supabase
      .from('app_users')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.log('❌ app_users table check failed:', tableError.message);
      return;
    }
    
    console.log('✅ app_users table exists');
    
    // Create the trigger function using raw SQL
    const createFunctionSQL = `
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
    `;
    
    // Create the trigger
    const createTriggerSQL = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();
    `;
    
    console.log('Creating handle_new_user function...');
    
    // Try to execute the SQL directly
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: createFunctionSQL
    });
    
    if (functionError) {
      console.log('❌ Function creation failed:', functionError.message);
      console.log('Trying alternative method...');
      
      // Alternative: Try using the PostgreSQL REST API directly
      const response = await fetch(`https://zxevebnmhikhdszwtiqk.supabase.co/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({ sql: createFunctionSQL })
      });
      
      if (!response.ok) {
        console.log('❌ Alternative method also failed');
        return;
      }
    }
    
    console.log('✅ Function created successfully');
    console.log('Creating trigger...');
    
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: createTriggerSQL
    });
    
    if (triggerError) {
      console.log('❌ Trigger creation failed:', triggerError.message);
      return;
    }
    
    console.log('✅ Trigger created successfully');
    console.log('🧪 Testing signup functionality...');
    
    // Test the signup
    const testEmail = `test-${Date.now()}@example.com`;
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          name: 'Test User'
        }
      }
    });
    
    if (error) {
      console.log('❌ Signup test failed:', error.message);
      console.log('Status:', error.status);
    } else {
      console.log('🎉 SIGNUP SUCCESS!');
      console.log('User ID:', data.user?.id);
      console.log('Email:', data.user?.email);
      
      // Wait a moment and check app_users table
      setTimeout(async () => {
        const { data: appUser, error: appError } = await supabase
          .from('app_users')
          .select('*')
          .eq('id', data.user?.id)
          .single();
          
        if (appError) {
          console.log('⚠️ App user verification failed:', appError.message);
        } else {
          console.log('🚀 PERFECT! Database triggers are working!');
          console.log('✅ Name:', appUser.name);
          console.log('✅ Status:', appUser.status);
          console.log('✅ Email:', appUser.email);
          console.log('🎊 SIGNUP FUNCTIONALITY IS NOW FULLY OPERATIONAL!');
        }
      }, 2000);
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

createTriggers();