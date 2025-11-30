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

async function testDatabaseData() {
  console.log('🔍 Checking database tables and data...\n');

  try {
    // Check app_users table
    console.log('📊 Checking app_users table:');
    const { data: users, error: usersError } = await supabase
      .from('app_users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Error querying app_users:', usersError.message);
    } else {
      console.log(`✅ Found ${users.length} users in app_users table`);
      if (users.length > 0) {
        console.log('   Sample user:', {
          id: users[0].id,
          email: users[0].email,
          name: users[0].name,
          status: users[0].status
        });
      }
    }

    // Check plans table
    console.log('\n📊 Checking plans table:');
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .limit(5);
    
    if (plansError) {
      console.log('❌ Error querying plans:', plansError.message);
    } else {
      console.log(`✅ Found ${plans.length} plans in plans table`);
      if (plans.length > 0) {
        console.log('   Sample plan:', {
          id: plans[0].id,
          title: plans[0].title,
          architect: plans[0].architect,
          building_type: plans[0].building_type
        });
      }
    }

    // Check admins table
    console.log('\n📊 Checking admins table:');
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('*')
      .limit(5);
    
    if (adminsError) {
      console.log('❌ Error querying admins:', adminsError.message);
    } else {
      console.log(`✅ Found ${admins.length} admins in admins table`);
      if (admins.length > 0) {
        console.log('   Sample admin:', {
          id: admins[0].id,
          email: admins[0].email,
          name: admins[0].name
        });
      }
    }

    // Test inserting a sample record to verify write capability
    console.log('\n🧪 Testing data insertion capability...');
    const testData = {
      title: 'Test Plan - ' + Date.now(),
      description: 'This is a test plan to verify database write functionality',
      architect: 'Test Architect',
      year: 2024,
      location: 'Test Location',
      building_type: 'Residential',
      keywords: ['test', 'sample'],
      download_count: 0,
      view_count: 0
    };

    const { data: insertedPlan, error: insertError } = await supabase
      .from('plans')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Error inserting test data:', insertError.message);
    } else {
      console.log('✅ Successfully inserted test plan:', insertedPlan.id);
      
      // Clean up - delete the test record
      const { error: deleteError } = await supabase
        .from('plans')
        .delete()
        .eq('id', insertedPlan.id);
      
      if (deleteError) {
        console.log('⚠️  Warning: Could not delete test record:', deleteError.message);
      } else {
        console.log('✅ Test record cleaned up successfully');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testDatabaseData();