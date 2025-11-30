const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { default: fetch } = require('node-fetch');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function refreshSchema() {
  console.log('🔄 Refreshing schema cache...');
  try {
    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/pg_schema_cache_reload`, {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (res.ok) {
      console.log("✅ Schema cache refreshed successfully!");
    } else {
      console.error("❌ Failed to refresh schema:", await res.text());
    }
  } catch (error) {
    console.error("❌ Error refreshing schema cache:", error.message);
  }
}

async function runDatabaseFix() {
  try {
    console.log('🚀 Starting database fix...\n');
    
    // First, let's try to create the storage bucket directly
    console.log('📦 Creating storage bucket...');
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('plan-files', {
      public: true,
      allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
      fileSizeLimit: 50 * 1024 * 1024 // 50MB
    });
    
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.log('⚠️  Bucket creation error:', bucketError.message);
    } else {
      console.log('✅ Storage bucket ready');
    }
    
    // Test if we can add missing columns by trying to insert a test record
    console.log('\n🔧 Testing database schema...');
    
    // Try to select from plans table to see current structure
    const { data: testData, error: testError } = await supabase
      .from('plans')
      .select('*')
      .limit(1);
      
    if (testError) {
      console.log('❌ Error accessing plans table:', testError.message);
      console.log('\n📋 You need to run the SQL script manually in Supabase dashboard:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select your project');
      console.log('3. Go to SQL Editor');
      console.log('4. Copy and paste the contents of fix-database.sql');
      console.log('5. Run the script');
      return;
    }
    
    console.log('✅ Plans table accessible');
    
    // Test the functions
    console.log('\n🔍 Testing database functions...');
    
    const { data: planStats, error: planStatsError } = await supabase.rpc('get_plan_stats');
    if (planStatsError) {
      console.log('❌ get_plan_stats function missing:', planStatsError.message);
    } else {
      console.log('✅ get_plan_stats function working:', planStats);
    }
    
    const { data: userStats, error: userStatsError } = await supabase.rpc('get_user_stats');
    if (userStatsError) {
      console.log('❌ get_user_stats function missing:', userStatsError.message);
    } else {
      console.log('✅ get_user_stats function working:', userStats);
    }
    
    // Test storage bucket
    console.log('\n📁 Testing storage bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.log('❌ Error listing buckets:', bucketsError.message);
    } else {
      const planFilesBucket = buckets.find(b => b.id === 'plan-files');
      if (planFilesBucket) {
        console.log('✅ plan-files bucket exists');
      } else {
        console.log('❌ plan-files bucket not found');
      }
    }
    
    console.log('\n🎉 Database check completed!');
    
    // Refresh schema cache to ensure all changes are recognized
    console.log('\n🔄 Refreshing Supabase schema cache...');
    await refreshSchema();
    
    console.log('\nIf there are missing functions or columns, please run the SQL script manually:');
    console.log('Copy the contents of fix-database.sql and run it in Supabase SQL Editor');
    
  } catch (error) {
    console.error('❌ Error during database fix:', error.message);
  }
}

runDatabaseFix();