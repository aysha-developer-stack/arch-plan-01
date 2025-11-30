import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase URL or Service Key not set in environment variables.');
  console.log('Required environment variables:');
  console.log('- SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY as fallback)');
  process.exit(1);
}

console.log('🔑 Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role Key' : 'Anon Key');

// Create admin client that can bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSupabaseAdmin() {
  try {
    console.log('🔗 Connecting to Supabase...');
    console.log('📍 Supabase URL:', supabaseUrl);

    const adminEmail = 'archplan.vivid@gmail.com';
    const adminPassword = 'Vividarch4321$$';
    const adminName = 'ArchPlan Admin';

    // Check if admin already exists in auth.users
    console.log('🔍 Checking if admin user already exists...');
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      return;
    }

    const existingAdmin = existingUsers.users.find(user => user.email === adminEmail);
    
    if (existingAdmin) {
      console.log('👤 Admin user already exists in Supabase Auth with email:', adminEmail);
      console.log('🆔 User ID:', existingAdmin.id);
      
      // Check if admin record exists in admins table
      const { data: adminRecord, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', existingAdmin.id)
        .single();

      if (adminError && adminError.code !== 'PGRST116') {
        console.error('❌ Error checking admin record:', adminError);
        return;
      }

      if (!adminRecord) {
        console.log('📝 Creating admin record in admins table...');
        const { data: newAdminRecord, error: createAdminError } = await supabase
          .from('admins')
          .insert({
            id: existingAdmin.id,
            email: existingAdmin.email,
            name: adminName
          })
          .select()
          .single();

        if (createAdminError) {
          console.error('❌ Error creating admin record:', createAdminError);
          return;
        }

        console.log('✅ Admin record created successfully:', newAdminRecord);
      } else {
        console.log('✅ Admin record already exists in admins table');
      }

      console.log('🎉 Admin setup complete! You can now login with:');
      console.log('📧 Email:', adminEmail);
      console.log('🔑 Password:', adminPassword);
      return;
    }

    // Create new admin user
    console.log('👤 Creating new admin user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        name: adminName,
        is_admin: true
      }
    });

    if (authError) {
      console.error('❌ Error creating admin user:', authError);
      return;
    }

    console.log('✅ Admin user created in Supabase Auth');
    console.log('🆔 User ID:', authData.user.id);

    // The trigger should automatically create the admin record, but let's verify
    console.log('🔍 Checking if admin record was created by trigger...');
    
    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: adminRecord, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (adminError && adminError.code !== 'PGRST116') {
      console.error('❌ Error checking admin record:', adminError);
      return;
    }

    if (!adminRecord) {
      console.log('📝 Trigger didn\'t create admin record, creating manually...');
      const { data: newAdminRecord, error: createAdminError } = await supabase
        .from('admins')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          name: adminName
        })
        .select()
        .single();

      if (createAdminError) {
        console.error('❌ Error creating admin record:', createAdminError);
        return;
      }

      console.log('✅ Admin record created successfully:', newAdminRecord);
    } else {
      console.log('✅ Admin record created by trigger:', adminRecord);
    }

    console.log('🎉 Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🌐 You can now login at: http://localhost:5000/admin/login');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createSupabaseAdmin();