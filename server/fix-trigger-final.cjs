const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zxevebnmhikhdszwtiqk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZXZlYm5taGlraGRzend0aXFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODEzMjU3MywiZXhwIjoyMDczNzA4NTczfQ.VWjqRnMGqw8dExlL0AI4nMZxKcpuYjr5GmNaVxfPn4g';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixTriggerIssue() {
  console.log('🔧 Starting comprehensive trigger fix...');
  
  try {
    // Step 1: Drop existing trigger and function
    console.log('1️⃣ Dropping existing trigger and function...');
    
    const dropCommands = [
      'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;',
      'DROP FUNCTION IF EXISTS handle_new_user();'
    ];
    
    for (const cmd of dropCommands) {
      const { error } = await supabase.rpc('exec_sql', { sql: cmd });
      if (error) {
        console.log(`⚠️ Drop command warning: ${error.message}`);
      } else {
        console.log(`✅ Executed: ${cmd}`);
      }
    }
    
    // Step 2: Create the function
    console.log('2️⃣ Creating handle_new_user function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.app_users (id, name, email, status)
        VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
          NEW.email,
          'pending'
        );
        
        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'Error in handle_new_user: %', SQLERRM;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    const { error: funcError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    if (funcError) {
      console.log('❌ Function creation failed:', funcError.message);
      return;
    }
    console.log('✅ Function created successfully');
    
    // Step 3: Create the trigger
    console.log('3️⃣ Creating trigger...');
    
    const createTriggerSQL = `
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION handle_new_user();
    `;
    
    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: createTriggerSQL });
    if (triggerError) {
      console.log('❌ Trigger creation failed:', triggerError.message);
      return;
    }
    console.log('✅ Trigger created successfully');
    
    // Step 4: Set up RLS policies
    console.log('4️⃣ Setting up RLS policies...');
    
    const rlsCommands = [
      'ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;',
      'DROP POLICY IF EXISTS "Service role can insert users" ON public.app_users;',
      `CREATE POLICY "Service role can insert users"
        ON public.app_users
        FOR INSERT
        TO service_role
        WITH CHECK (true);`,
      'DROP POLICY IF EXISTS "Users can insert own record" ON public.app_users;',
      `CREATE POLICY "Users can insert own record"
        ON public.app_users
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = id);`
    ];
    
    for (const cmd of rlsCommands) {
      const { error } = await supabase.rpc('exec_sql', { sql: cmd });
      if (error) {
        console.log(`⚠️ RLS command warning: ${error.message}`);
      } else {
        console.log(`✅ RLS policy set`);
      }
    }
    
    // Step 5: Test the setup
    console.log('5️⃣ Testing the trigger setup...');
    
    // Create a test user to verify trigger works
    const testEmail = `trigger.test.${Date.now()}@gmail.com`;
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!'
    });
    
    if (signupError) {
      console.log('❌ Test signup failed:', signupError.message);
      return;
    }
    
    console.log('✅ Test user created:', signupData.user.id);
    
    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if user was added to app_users
    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', signupData.user.id)
      .single();
    
    if (appUserError) {
      console.log('❌ Trigger test failed - user not in app_users:', appUserError.message);
      console.log('🚨 TRIGGER IS STILL NOT WORKING!');
    } else {
      console.log('🎉 SUCCESS! Trigger is working!');
      console.log('📋 App user record:', appUser);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

// Check if exec_sql RPC function exists, if not provide manual instructions
async function checkAndFix() {
  try {
    // Test if we can use exec_sql
    const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1;' });
    
    if (error && error.message.includes('function "exec_sql" does not exist')) {
      console.log('❌ exec_sql function not available');
      console.log('📋 MANUAL INSTRUCTIONS:');
      console.log('');
      console.log('Go to: https://supabase.com/dashboard/project/zxevebnmhikhdszwtiqk/sql');
      console.log('');
      console.log('Copy and paste this COMPLETE SQL script:');
      console.log('');
      console.log('-- Drop existing trigger and function');
      console.log('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;');
      console.log('DROP FUNCTION IF EXISTS handle_new_user();');
      console.log('');
      console.log('-- Create the function');
      console.log('CREATE OR REPLACE FUNCTION handle_new_user()');
      console.log('RETURNS TRIGGER AS $$');
      console.log('BEGIN');
      console.log('  INSERT INTO public.app_users (id, name, email, status)');
      console.log('  VALUES (');
      console.log('    NEW.id,');
      console.log('    COALESCE(NEW.raw_user_meta_data->>\'name\', \'User\'),');
      console.log('    NEW.email,');
      console.log('    \'pending\'');
      console.log('  );');
      console.log('  ');
      console.log('  RETURN NEW;');
      console.log('EXCEPTION');
      console.log('  WHEN OTHERS THEN');
      console.log('    RAISE LOG \'Error in handle_new_user: %\', SQLERRM;');
      console.log('    RETURN NEW;');
      console.log('END;');
      console.log('$$ LANGUAGE plpgsql SECURITY DEFINER;');
      console.log('');
      console.log('-- Create the trigger');
      console.log('CREATE TRIGGER on_auth_user_created');
      console.log('  AFTER INSERT ON auth.users');
      console.log('  FOR EACH ROW');
      console.log('  EXECUTE FUNCTION handle_new_user();');
      console.log('');
      console.log('-- Set up RLS');
      console.log('ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('DROP POLICY IF EXISTS "Service role can insert users" ON public.app_users;');
      console.log('CREATE POLICY "Service role can insert users"');
      console.log('  ON public.app_users');
      console.log('  FOR INSERT');
      console.log('  TO service_role');
      console.log('  WITH CHECK (true);');
      console.log('');
      console.log('DROP POLICY IF EXISTS "Users can insert own record" ON public.app_users;');
      console.log('CREATE POLICY "Users can insert own record"');
      console.log('  ON public.app_users');
      console.log('  FOR INSERT');
      console.log('  TO authenticated');
      console.log('  WITH CHECK (auth.uid() = id);');
      console.log('');
      console.log('🔥 After running this SQL, tell me "ready" to test again!');
    } else {
      // We can use RPC, proceed with automated fix
      await fixTriggerIssue();
    }
  } catch (error) {
    console.error('💥 Error checking RPC availability:', error.message);
  }
}

checkAndFix();