const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(
  'https://zxevebnmhikhdszwtiqk.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false }
  }
);

async function createTriggersAlternative() {
  console.log('🔧 Creating database triggers using alternative method...');
  
  try {
    // Check available RPC functions first
    console.log('Checking available RPC functions...');
    
    // Let's try to create the function and trigger using a different approach
    // We'll use the PostgreSQL REST API directly with raw SQL
    
    const functionSQL = `
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();
    `.trim();
    
    console.log('Attempting to create triggers via PostgreSQL REST API...');
    
    // Use fetch to call the PostgreSQL REST API directly
    const response = await fetch(`https://zxevebnmhikhdszwtiqk.supabase.co/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ 
        query: functionSQL
      })
    });
    
    if (!response.ok) {
      console.log('❌ REST API method failed, trying direct SQL execution...');
      
      // Try using the SQL editor endpoint
      const sqlResponse = await fetch(`https://zxevebnmhikhdszwtiqk.supabase.co/rest/v1/rpc/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({ 
          sql: functionSQL
        })
      });
      
      if (!sqlResponse.ok) {
        console.log('❌ All programmatic methods failed.');
        console.log('🚨 MANUAL ACTION REQUIRED:');
        console.log('You MUST run the SQL script manually in Supabase dashboard:');
        console.log('1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project: zxevebnmhikhdszwtiqk');
        console.log('3. Click "SQL Editor"');
        console.log('4. Paste and run this SQL:');
        console.log('---');
        console.log(functionSQL);
        console.log('---');
        return;
      }
    }
    
    console.log('✅ Triggers created successfully!');
    console.log('🧪 Testing signup functionality...');
    
    // Test the signup
    const testEmail = `final-test-${Date.now()}@example.com`;
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          name: 'Final Test User'
        }
      }
    });
    
    if (error) {
      console.log('❌ Signup test failed:', error.message);
      console.log('Status:', error.status);
      console.log('🚨 The triggers were not created successfully.');
    } else {
      console.log('🎉 SIGNUP SUCCESS!');
      console.log('User ID:', data.user?.id);
      console.log('Email:', data.user?.email);
      
      // Wait and check app_users table
      setTimeout(async () => {
        const { data: appUser, error: appError } = await supabase
          .from('app_users')
          .select('*')
          .eq('id', data.user?.id)
          .single();
          
        if (appError) {
          console.log('⚠️ App user verification failed:', appError.message);
          console.log('🚨 Triggers may not be working properly.');
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
    console.log('🚨 Please run the SQL script manually in Supabase dashboard.');
  }
}

createTriggersAlternative();