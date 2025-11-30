const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zxevebnmhikhdszwtiqk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZXZlYm5taGlraGRzend0aXFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODEzMjU3MywiZXhwIjoyMDczNzA4NTczfQ.VWjqRnMGqw8dExlL0AI4nMZxKcpuYjr5GmNaVxfPn4g';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseTriggerIssue() {
  console.log('🔍 COMPREHENSIVE TRIGGER DIAGNOSIS');
  console.log('=====================================');
  
  try {
    // Check if handle_new_user function exists
    console.log('1️⃣ Checking if handle_new_user function exists...');
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname, prosrc')
      .eq('proname', 'handle_new_user');
    
    if (funcError) {
      console.log('❌ Error checking functions:', funcError.message);
    } else if (functions && functions.length > 0) {
      console.log('✅ handle_new_user function EXISTS');
      console.log('📋 Function source preview:', functions[0].prosrc.substring(0, 100) + '...');
    } else {
      console.log('❌ handle_new_user function NOT FOUND');
    }
    
    // Check if trigger exists
    console.log('\n2️⃣ Checking if trigger exists...');
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_name', 'on_auth_user_created');
    
    if (triggerError) {
      console.log('❌ Error checking triggers:', triggerError.message);
    } else if (triggers && triggers.length > 0) {
      console.log('✅ on_auth_user_created trigger EXISTS');
      console.log('📋 Trigger details:', {
        table: triggers[0].event_object_table,
        schema: triggers[0].event_object_schema,
        timing: triggers[0].action_timing,
        event: triggers[0].event_manipulation
      });
    } else {
      console.log('❌ on_auth_user_created trigger NOT FOUND');
    }
    
    // Check RLS policies
    console.log('\n3️⃣ Checking RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'app_users');
    
    if (policyError) {
      console.log('❌ Error checking policies:', policyError.message);
    } else if (policies && policies.length > 0) {
      console.log('✅ RLS policies found:', policies.length);
      policies.forEach((policy, index) => {
        console.log(`   ${index + 1}. ${policy.policyname} (${policy.cmd})`);
      });
    } else {
      console.log('⚠️ No RLS policies found for app_users');
    }
    
    // Check table structure
    console.log('\n4️⃣ Checking app_users table structure...');
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'app_users')
      .eq('table_schema', 'public');
    
    if (columnError) {
      console.log('❌ Error checking table structure:', columnError.message);
    } else if (columns && columns.length > 0) {
      console.log('✅ app_users table structure:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('❌ app_users table NOT FOUND');
    }
    
    // Test manual insert
    console.log('\n5️⃣ Testing manual insert into app_users...');
    const testId = 'test-' + Date.now();
    const { data: insertData, error: insertError } = await supabase
      .from('app_users')
      .insert({
        id: testId,
        name: 'Test User',
        email: 'test@example.com',
        status: 'pending'
      })
      .select();
    
    if (insertError) {
      console.log('❌ Manual insert failed:', insertError.message);
      console.log('🚨 This indicates RLS or permission issues!');
    } else {
      console.log('✅ Manual insert successful:', insertData);
      
      // Clean up test record
      await supabase.from('app_users').delete().eq('id', testId);
      console.log('🧹 Test record cleaned up');
    }
    
    // Final recommendations
    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('=====================================');
    
    if (functions && functions.length === 0) {
      console.log('🚨 ISSUE: handle_new_user function is missing');
      console.log('💡 SOLUTION: Re-run the CREATE FUNCTION SQL');
    }
    
    if (triggers && triggers.length === 0) {
      console.log('🚨 ISSUE: on_auth_user_created trigger is missing');
      console.log('💡 SOLUTION: Re-run the CREATE TRIGGER SQL');
    }
    
    if (insertError) {
      console.log('🚨 ISSUE: Cannot insert into app_users table');
      console.log('💡 SOLUTION: Fix RLS policies or table permissions');
    }
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Go to Supabase SQL Editor');
    console.log('2. Re-run the complete SQL script');
    console.log('3. Check for any error messages');
    console.log('4. Verify all commands show SUCCESS');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

diagnoseTriggerIssue();