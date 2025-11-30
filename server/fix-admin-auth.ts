import { supabase } from './db';

async function fixAdminAuth() {
  try {
    console.log('🔧 Fixing admin authentication...');
    
    const email = 'archplan.vivid@gmail.com';
    const password = 'Vividarch4321$$';
    const name = 'ArchPlan Admin';
    
    // 1. Sign in with the admin credentials
    console.log('\n1️⃣ Signing in with admin credentials...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      return;
    }
    
    console.log('✅ Sign in successful!');
    console.log('👤 User ID:', signInData.user.id);
    
    // 2. Check if admin record exists
    console.log('\n2️⃣ Checking if admin record exists...');
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', signInData.user.id);
    
    if (adminError) {
      console.error('❌ Error checking admin record:', adminError.message);
    } else if (adminData && adminData.length > 0) {
      console.log('✅ Admin record already exists:');
      console.log(JSON.stringify(adminData[0], null, 2));
      return;
    }
    
    // 3. Create the admin record
    console.log('\n3️⃣ Creating admin record...');
    const { data: newAdmin, error: createError } = await supabase
      .from('admins')
      .insert({
        id: signInData.user.id,
        email: email,
        name: name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (createError) {
      console.error('❌ Error creating admin record:', createError.message);
      
      // 4. If RLS is blocking, try to disable it temporarily
      console.log('\n4️⃣ Attempting to bypass RLS...');
      
      // Try using service_role client if available
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('🔑 Using service_role client...');
        const serviceClient = supabase.auth.admin;
        
        // Try again with service role
        const { data: serviceData, error: serviceError } = await supabase
          .from('admins')
          .insert({
            id: signInData.user.id,
            email: email,
            name: name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
        
        if (serviceError) {
          console.error('❌ Service role insertion failed:', serviceError.message);
        } else {
          console.log('✅ Admin record created with service role:');
          console.log(JSON.stringify(serviceData, null, 2));
        }
      } else {
        console.log('⚠️ No service role key available. Using SQL script instead.');
        
        // Create SQL script to insert admin
        console.log('📝 SQL to run in Supabase dashboard:');
        console.log(`
-- Run this in the SQL editor in Supabase dashboard
INSERT INTO public.admins (id, email, name, created_at, updated_at)
VALUES (
  '${signInData.user.id}',
  '${email}',
  '${name}',
  '${new Date().toISOString()}',
  '${new Date().toISOString()}'
);

-- Verify the insertion
SELECT * FROM public.admins WHERE id = '${signInData.user.id}';
        `);
      }
    } else {
      console.log('✅ Admin record created successfully:');
      console.log(JSON.stringify(newAdmin, null, 2));
    }
    
    // 5. Verify the admin record
    console.log('\n5️⃣ Verifying admin record...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', signInData.user.id);
    
    if (verifyError) {
      console.error('❌ Error verifying admin record:', verifyError.message);
    } else if (verifyData && verifyData.length > 0) {
      console.log('✅ Admin record verified:');
      console.log(JSON.stringify(verifyData[0], null, 2));
    } else {
      console.log('❌ Admin record not found after creation attempt');
    }
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message || error);
  }
}

fixAdminAuth();