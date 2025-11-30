const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zxevebnmhikhdszwtiqk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZXZlYm5taGlraGRzend0aXFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODEzMjU3MywiZXhwIjoyMDczNzA4NTczfQ.VWjqRnMGqw8dExlL0AI4nMZxKcpuYjr5GmNaVxfPn4g';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addDownloadCountColumn() {
  console.log('📊 Manually adding download_count column to app_users table...');
  
  try {
    // First, let's check the current table structure
    console.log('🔍 Checking current table structure...');
    
    const { data: users, error: checkError } = await supabase
      .from('app_users')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error accessing app_users table:', checkError);
      return;
    }
    
    if (users.length > 0) {
      console.log('📋 Current columns:', Object.keys(users[0]));
      
      if (users[0].hasOwnProperty('download_count')) {
        console.log('✅ download_count column already exists!');
        console.log('📊 Sample user download count:', users[0].download_count);
        return;
      }
    }
    
    console.log('⚠️ download_count column does not exist');
    console.log('📝 You need to manually add this column in Supabase Dashboard:');
    console.log('');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Navigate to your project');
    console.log('3. Go to Table Editor');
    console.log('4. Select the "app_users" table');
    console.log('5. Click "Add Column"');
    console.log('6. Set:');
    console.log('   - Name: download_count');
    console.log('   - Type: int4 (integer)');
    console.log('   - Default value: 0');
    console.log('   - Allow nullable: No');
    console.log('7. Click "Save"');
    console.log('');
    console.log('Alternatively, run this SQL in the SQL Editor:');
    console.log('ALTER TABLE app_users ADD COLUMN download_count INTEGER DEFAULT 0;');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

addDownloadCountColumn();