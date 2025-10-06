import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase URL or Service Key not set in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addPlotLengthColumn() {
  console.log('🚀 Adding plotLength column to plans table...\n');

  try {
    // Use the RPC function to execute SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE plans ADD COLUMN IF NOT EXISTS plotLength DECIMAL(10,3);
        CREATE INDEX IF NOT EXISTS idx_plans_plotLength ON plans (plotLength);
      `
    });

    if (error) {
      console.error('❌ Error adding plotLength column:', error);
      
      // Try alternative approach - check if column exists by querying
      console.log('🔍 Checking if plotLength column already exists...');
      
      const { data: testData, error: testError } = await supabase
        .from('plans')
        .select('plotLength')
        .limit(1);
        
      if (testError) {
        if (testError.message.includes('column "plotlength" does not exist')) {
          console.log('❌ plotLength column does not exist in the database.');
          console.log('📝 Please run the following SQL manually in your Supabase dashboard:');
          console.log('   ALTER TABLE plans ADD COLUMN plotLength DECIMAL(10,3);');
          console.log('   CREATE INDEX idx_plans_plotLength ON plans (plotLength);');
        } else {
          console.error('❌ Unexpected error:', testError);
        }
      } else {
        console.log('✅ plotLength column already exists!');
      }
    } else {
      console.log('✅ plotLength column added successfully!');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    
    // Try to check if column exists
    console.log('🔍 Checking if plotLength column exists...');
    try {
      const { data: testData, error: testError } = await supabase
        .from('plans')
        .select('plotLength')
        .limit(1);
        
      if (testError && testError.message.includes('column "plotlength" does not exist')) {
        console.log('❌ plotLength column does not exist in the database.');
        console.log('📝 Please run the following SQL manually in your Supabase dashboard:');
        console.log('   ALTER TABLE plans ADD COLUMN plotLength DECIMAL(10,3);');
        console.log('   CREATE INDEX idx_plans_plotLength ON plans (plotLength);');
      } else if (!testError) {
        console.log('✅ plotLength column already exists!');
      }
    } catch (checkErr) {
      console.error('❌ Could not check column existence:', checkErr);
    }
  }
}

addPlotLengthColumn();