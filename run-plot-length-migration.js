import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Running plot length columns migration...\n');
    
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'server', 'add-plot-length-columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded from:', migrationPath);
    console.log('📝 Migration content preview:');
    console.log(migrationSQL.split('\n').slice(0, 5).join('\n') + '...\n');
    
    // Execute the migration
    console.log('⚡ Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      
      // Try alternative approach - execute statements one by one
      console.log('🔄 Trying alternative approach - executing statements individually...');
      
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
          if (stmtError) {
            console.warn(`   ⚠️  Statement ${i + 1} warning:`, stmtError.message);
          } else {
            console.log(`   ✅ Statement ${i + 1} executed successfully`);
          }
        } catch (stmtErr) {
          console.warn(`   ⚠️  Statement ${i + 1} error:`, stmtErr.message);
        }
      }
    } else {
      console.log('✅ Migration executed successfully!');
      if (data) {
        console.log('📊 Migration result:', data);
      }
    }
    
    // Verify the columns were added
    console.log('\n🔍 Verifying columns were added...');
    
    const { data: testData, error: testError } = await supabase
      .from('plans')
      .select('plotLengthMin, plotLengthMax, plotWidth, coveredArea')
      .limit(1);
    
    if (testError) {
      console.error('❌ Verification failed:', testError.message);
    } else {
      console.log('✅ Columns verified successfully!');
      console.log('📊 Sample data structure:', Object.keys(testData[0] || {}));
    }
    
    console.log('\n🎉 Migration completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error during migration:', error);
  }
}

runMigration();