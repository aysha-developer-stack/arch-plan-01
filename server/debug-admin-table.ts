import dotenv from 'dotenv';
import { supabase } from './db';

// Load environment variables from parent directory
dotenv.config({ path: '../.env' });

async function debugAdminTable() {
  try {
    console.log('🔍 Debugging admin table...');
    
    // First, let's check all records in the admin table
    console.log('\n1️⃣ Checking all admin records...');
    const { data: allAdmins, error: allError } = await supabase
      .from('admins')
      .select('*');

    if (allError) {
      console.error('❌ Error querying all admins:', allError);
    } else {
      console.log('✅ All admin records:', allAdmins);
      console.log('📊 Total admin records:', allAdmins?.length || 0);
    }

    // Check specifically for our admin user
    console.log('\n2️⃣ Checking for specific admin by email...');
    const { data: emailAdmin, error: emailError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', 'archplan.vivid@gmail.com');

    if (emailError) {
      console.error('❌ Error querying admin by email:', emailError);
    } else {
      console.log('✅ Admin by email:', emailAdmin);
    }

    // Check by user ID
    console.log('\n3️⃣ Checking for specific admin by ID...');
    const { data: idAdmin, error: idError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', '829aa91c-5eef-4465-bbaa-bb32b2c2240c');

    if (idError) {
      console.error('❌ Error querying admin by ID:', idError);
    } else {
      console.log('✅ Admin by ID:', idAdmin);
    }

    // Check auth user
    console.log('\n4️⃣ Checking auth user...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'archplan.vivid@gmail.com',
      password: 'Vividarch4321$$'
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
    } else {
      console.log('✅ Sign in successful');
      console.log('👤 User ID:', signInData.user.id);
      console.log('📧 Email:', signInData.user.email);
      
      // Now try to query admin table while authenticated
      console.log('\n5️⃣ Checking admin record while authenticated...');
      const { data: authAdmin, error: authError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', signInData.user.id)
        .single();

      if (authError) {
        console.error('❌ Error querying admin while authenticated:', authError);
      } else {
        console.log('✅ Admin record while authenticated:', authAdmin);
      }

      // Sign out
      await supabase.auth.signOut();
    }

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message || error);
  }
}

debugAdminTable();