import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase URL or Anon Key not set in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupDatabase() {
  console.log('🚀 Setting up ArchPlan database...\n');

  try {
    // Read the SQL setup file
    const sqlFilePath = join(__dirname, 'supabase-setup.sql');
    const setupSQL = readFileSync(sqlFilePath, 'utf8');
    
    console.log('📝 SQL file loaded successfully');
    console.log('📄 SQL file contains:', setupSQL.length, 'characters');

    // Since we can't execute SQL directly through the JS client,
    // let's test if the tables already exist by trying to query them
    console.log('\n🔍 Checking if database is already set up...');

    // Test if tables exist by trying to query them
    const { data: usersData, error: usersError } = await supabase
      .from('app_users')
      .select('count', { count: 'exact', head: true });

    const { data: adminsData, error: adminsError } = await supabase
      .from('admins')
      .select('count', { count: 'exact', head: true });

    const { data: plansData, error: plansError } = await supabase
      .from('plans')
      .select('count', { count: 'exact', head: true });

    if (!usersError && !adminsError && !plansError) {
      console.log('✅ Database is already set up!');
      console.log(`   • app_users table: ${usersData?.length || 0} records`);
      console.log(`   • admins table: ${adminsData?.length || 0} records`);
      console.log(`   • plans table: ${plansData?.length || 0} records`);

      // Test inserting sample data
      console.log('\n🧪 Testing data operations...');
      
      const testPlan = {
        title: 'Test Architectural Plan',
        description: 'A test plan to verify database functionality',
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

      console.log('\n🎉 Database is fully functional!');
      
    } else {
      console.log('❌ Database tables not found. You need to set up the database first.');
      console.log('\n📋 To set up your database, follow these steps:');
      console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
      console.log('2. Select your project');
      console.log('3. Go to the SQL Editor');
      console.log('4. Copy and paste the contents of supabase-setup.sql');
      console.log('5. Run the SQL script');
      console.log('\nAlternatively, you can copy the SQL from here:');
      console.log('─'.repeat(50));
      console.log(setupSQL);
      console.log('─'.repeat(50));
    }

  } catch (error) {
    console.error('❌ Error during setup:', error);
  }
}

// Run the setup
setupDatabase();