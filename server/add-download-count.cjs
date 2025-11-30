const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://zxevebnmhikhdszwtiqk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZXZlYm5taGlraGRzend0aXFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODEzMjU3MywiZXhwIjoyMDczNzA4NTczfQ.VWjqRnMGqw8dExlL0AI4nMZxKcpuYjr5GmNaVxfPn4g';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addDownloadCountColumn() {
  console.log('📊 Adding download_count column to app_users table...');
  
  try {
    // Execute the SQL directly
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: `
        -- Add download_count column to app_users table
        ALTER TABLE app_users 
        ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

        -- Update existing users to have a default download count of 0
        UPDATE app_users 
        SET download_count = 0 
        WHERE download_count IS NULL;
      `
    });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative approach - direct SQL execution
      console.log('🔄 Trying alternative approach...');
      
      const { error: altError } = await supabase
        .from('app_users')
        .select('id')
        .limit(1);
      
      if (altError) {
        console.error('❌ Cannot access app_users table:', altError);
        return;
      }
      
      console.log('✅ Table accessible, column might already exist');
    } else {
      console.log('✅ Successfully executed SQL commands');
    }
    
    // Verify the column exists by selecting it
    const { data: users, error: selectError } = await supabase
      .from('app_users')
      .select('id, email, name, download_count')
      .limit(3);
    
    if (selectError) {
      console.error('❌ Error verifying column:', selectError);
      
      // If download_count doesn't exist, the error will mention it
      if (selectError.message.includes('download_count')) {
        console.log('⚠️ download_count column does not exist yet');
        
        // Try to add it using a different method
        console.log('🔄 Attempting to add column using direct query...');
        
        const { error: addError } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE app_users ADD COLUMN download_count INTEGER DEFAULT 0;'
        });
        
        if (addError) {
          console.error('❌ Failed to add column:', addError);
        } else {
          console.log('✅ Column added successfully');
        }
      }
      return;
    }
    
    console.log('✅ download_count column exists and is accessible');
    console.log('📋 Sample users with download_count:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. Email: ${user.email}, Name: ${user.name}, Downloads: ${user.download_count}`);
    });
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

addDownloadCountColumn();