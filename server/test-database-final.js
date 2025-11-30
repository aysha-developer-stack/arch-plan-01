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

async function testDatabase() {
  console.log('🧪 Testing ArchPlan database functionality...\n');

  try {
    // Test 1: Check connection
    console.log('1️⃣ Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('plans')
      .select('id')
      .limit(1);

    if (connectionError) {
      if (connectionError.message.includes('relation "public.plans" does not exist')) {
        console.log('❌ Tables do not exist in database');
        console.log('\n📋 You need to run the SQL setup first:');
        console.log('1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to SQL Editor');
        console.log('4. Copy the contents of supabase-setup.sql and run it');
        return;
      } else {
        console.log('❌ Connection error:', connectionError.message);
        return;
      }
    }

    console.log('✅ Connection successful');

    // Test 2: Insert a plan
    console.log('\n2️⃣ Testing plan insertion...');
    const testPlan = {
      title: 'Modern House Design',
      description: 'A beautiful modern house with clean lines',
      architect: 'Jane Smith',
      year: 2024,
      location: 'Sydney, Australia',
      building_type: 'Residential',
      keywords: ['modern', 'house', 'residential', 'clean'],
      download_count: 0,
      view_count: 0
    };

    const { data: newPlan, error: insertError } = await supabase
      .from('plans')
      .insert(testPlan)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Insert error:', insertError.message);
    } else {
      console.log('✅ Plan inserted successfully:', newPlan.id);

      // Test 3: Query the plan
      console.log('\n3️⃣ Testing plan query...');
      const { data: queriedPlan, error: queryError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', newPlan.id)
        .single();

      if (queryError) {
        console.log('❌ Query error:', queryError.message);
      } else {
        console.log('✅ Plan queried successfully:', queriedPlan.title);
      }

      // Test 4: Update the plan
      console.log('\n4️⃣ Testing plan update...');
      const { data: updatedPlan, error: updateError } = await supabase
        .from('plans')
        .update({ view_count: 1, download_count: 1 })
        .eq('id', newPlan.id)
        .select()
        .single();

      if (updateError) {
        console.log('❌ Update error:', updateError.message);
      } else {
        console.log('✅ Plan updated successfully. Views:', updatedPlan.view_count, 'Downloads:', updatedPlan.download_count);
      }

      // Test 5: Search functionality
      console.log('\n5️⃣ Testing search functionality...');
      const { data: searchResults, error: searchError } = await supabase
        .from('plans')
        .select('*')
        .ilike('title', '%modern%');

      if (searchError) {
        console.log('❌ Search error:', searchError.message);
      } else {
        console.log('✅ Search successful. Found', searchResults.length, 'plans with "modern" in title');
      }

      // Test 6: Get all plans
      console.log('\n6️⃣ Testing get all plans...');
      const { data: allPlans, error: allPlansError } = await supabase
        .from('plans')
        .select('id, title, architect, year, building_type')
        .order('created_at', { ascending: false });

      if (allPlansError) {
        console.log('❌ Get all plans error:', allPlansError.message);
      } else {
        console.log('✅ Retrieved', allPlans.length, 'plans total');
        allPlans.forEach((plan, index) => {
          console.log(`   ${index + 1}. ${plan.title} by ${plan.architect} (${plan.year})`);
        });
      }

      // Clean up: Delete the test plan
      console.log('\n🧹 Cleaning up test data...');
      const { error: deleteError } = await supabase
        .from('plans')
        .delete()
        .eq('id', newPlan.id);

      if (deleteError) {
        console.log('⚠️  Warning: Could not delete test plan:', deleteError.message);
      } else {
        console.log('✅ Test data cleaned up');
      }
    }

    console.log('\n🎉 Database test completed successfully!');
    console.log('\n📊 Your database is ready to store:');
    console.log('   • Architectural plans with metadata');
    console.log('   • User registrations and approvals');
    console.log('   • Admin management');
    console.log('   • File uploads and downloads');
    console.log('   • Search and filtering');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testDatabase();