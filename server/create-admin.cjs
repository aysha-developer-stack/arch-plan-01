const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  try {
    console.log('Creating admin user...');
    
    const email = 'admin@archplan.com';
    const password = 'admin123456';
    const name = 'Admin User';

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        name,
        is_admin: true
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('Auth user created successfully:', authData.user.id);

    // Check if admin record was created by trigger
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (adminError) {
      console.log('Admin record not found, creating manually...');
      // If the trigger didn't work, create the admin record manually
      const { data: newAdmin, error: createError } = await supabase
        .from('admins')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          name
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating admin record:', createError);
        return;
      }

      console.log('Admin record created manually:', newAdmin);
    } else {
      console.log('Admin record created by trigger:', adminData);
    }

    console.log('\n✅ Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('You can now login to the admin panel.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdmin();