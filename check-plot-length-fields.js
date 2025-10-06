import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlotLengthFields() {
  try {
    console.log('🔍 Checking database for plotLengthMin and plotLengthMax values...\n');
    
    // Query all plans to check for plotLengthMin and plotLengthMax values
    const { data: plans, error } = await supabase
      .from('plans')
      .select('id, title, plotLengthMin, plotLengthMax, created_at')
      .order('created_at', { ascending: false })
      .limit(20); // Get latest 20 records
    
    if (error) {
      console.error('❌ Error fetching plans:', error);
      return;
    }
    
    if (!plans || plans.length === 0) {
      console.log('📭 No plans found in database');
      return;
    }
    
    console.log(`📊 Found ${plans.length} plans. Checking plotLength fields:\n`);
    
    let hasPlotLengthMin = 0;
    let hasPlotLengthMax = 0;
    let hasNullValues = 0;
    
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. Plan: "${plan.title}" (ID: ${plan.id})`);
      console.log(`   plotLengthMin: ${plan.plotLengthMin}`);
      console.log(`   plotLengthMax: ${plan.plotLengthMax}`);
      console.log(`   Created: ${new Date(plan.created_at).toLocaleString()}\n`);
      
      if (plan.plotLengthMin !== null && plan.plotLengthMin !== undefined) {
        hasPlotLengthMin++;
      }
      if (plan.plotLengthMax !== null && plan.plotLengthMax !== undefined) {
        hasPlotLengthMax++;
      }
      if (plan.plotLengthMin === null && plan.plotLengthMax === null) {
        hasNullValues++;
      }
    });
    
    console.log('📈 Summary:');
    console.log(`   Plans with plotLengthMin values: ${hasPlotLengthMin}/${plans.length}`);
    console.log(`   Plans with plotLengthMax values: ${hasPlotLengthMax}/${plans.length}`);
    console.log(`   Plans with both fields null: ${hasNullValues}/${plans.length}`);
    
    // Check if the columns exist in the database schema
    console.log('\n🔧 Checking database schema...');
    const { data: columns, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'plans' })
      .single();
    
    if (schemaError) {
      console.log('⚠️  Could not check schema directly, but fields appear to exist based on query results');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkPlotLengthFields();