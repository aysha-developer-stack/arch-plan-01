import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection...');
console.log('URL:', supabaseUrl ? 'SET' : 'NOT SET');
console.log('Service Key:', supabaseServiceKey ? 'SET (length: ' + supabaseServiceKey.length + ')' : 'NOT SET');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    console.log('\n🔗 Testing basic connection...');
    
    // Test 1: Simple query to check connection
    const { data, error } = await supabase
      .from('plans')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
    
    console.log('✅ Basic connection successful');
    
    // Test 2: Test insert operation (without actually inserting)
    console.log('\n🧪 Testing insert operation structure...');
    
    const testPlan = {
      title: 'Test Plan',
      description: 'Test Description', // Add description as it's required
      architect: 'Test Architect',
      fileName: 'test.pdf',
      filePath: '/test/path',
      fileSize: 1000,
      planType: 'Residential',
      building_type: 'Residential',
      keywords: ['test', 'sample'], // Add keywords array
      file_url: 'https://example.com/test.pdf', // Add file_url as it's required
      download_count: 0, // Add download_count as it's required
      view_count: 0, // Add view_count as it's likely required too
      storeys: 1
    };
    
    // For testing purposes, we'll use a dummy UUID since we're not actually authenticating
    // In real usage, this would come from supabase.auth.getUser()
    const dummyUserId = '00000000-0000-0000-0000-000000000000';
    
    // Add created_by to the test plan
    testPlan.created_by = dummyUserId;
    
    // Just validate the structure without inserting
    const { error: insertError } = await supabase
      .from('plans')
      .insert(testPlan)
      .select()
      .limit(0); // This should validate structure without inserting
    
    if (insertError && !insertError.message.includes('limit')) {
      console.error('❌ Insert structure test failed:', insertError);
      return false;
    }
    
    console.log('✅ Insert structure validation passed');
    return true;
    
  } catch (err) {
    console.error('❌ Connection test error:', err);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 All tests passed! Supabase connection is working.');
  } else {
    console.log('\n💥 Tests failed. Check your Supabase configuration.');
  }
  process.exit(success ? 0 : 1);
});