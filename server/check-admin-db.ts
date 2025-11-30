import { supabase } from './db';

async function checkAdminRecord() {
  try {
    console.log('🔍 Checking admin records in the database...');
    
    // 1. Check all admin records
    const { data: allAdmins, error: allAdminsError } = await supabase
      .from('admins')
      .select('*');
    
    if (allAdminsError) {
      console.error('❌ Error fetching all admins:', allAdminsError.message);
    } else {
      console.log(`✅ Found ${allAdmins.length} admin records:`);
      console.log(JSON.stringify(allAdmins, null, 2));
    }
    
    // 2. Try to sign in with the admin credentials
    console.log('\n🔑 Attempting to sign in with admin credentials...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'archplan.vivid@gmail.com',
      password: 'Vividarch4321$$'
    });
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
    } else {
      console.log('✅ Sign in successful!');
      console.log('👤 User ID:', signInData.user.id);
      console.log('📧 Email:', signInData.user.email);
      console.log('🔒 Session expires in:', signInData.session?.expires_in, 'seconds');
      
      // 3. Check if this user is in the admins table
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', signInData.user.id)
        .single();
      
      if (adminError) {
        console.error('❌ Error checking admin record:', adminError.message);
        
        // Try to find by email instead
        const { data: adminByEmail, error: emailError } = await supabase
          .from('admins')
          .select('*')
          .eq('email', signInData.user.email);
        
        if (emailError) {
          console.error('❌ Error checking admin by email:', emailError.message);
        } else if (adminByEmail && adminByEmail.length > 0) {
          console.log('✅ Found admin record by email:');
          console.log(JSON.stringify(adminByEmail[0], null, 2));
          console.log('⚠️ But the IDs don\'t match!');
          console.log('🔄 Auth user ID:', signInData.user.id);
          console.log('🔄 Admin record ID:', adminByEmail[0].id);
        } else {
          console.log('❌ No admin record found for this user');
        }
      } else {
        console.log('✅ User is an admin!');
        console.log(JSON.stringify(adminData, null, 2));
      }
    }
    
    // 4. Check RLS policies
    console.log('\n🛡️ Checking RLS policies for admins table...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'admins' });
    
    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError.message);
    } else {
      console.log('✅ Policies for admins table:');
      console.log(JSON.stringify(policies, null, 2));
    }
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message || error);
  } finally {
    // Sign out to clean up
    await supabase.auth.signOut();
  }
}

checkAdminRecord();