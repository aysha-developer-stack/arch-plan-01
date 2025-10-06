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

async function debugUploadData() {
  try {
    console.log('🔍 Debugging upload data for plotLength fields...\n');
    
    // Get the most recent plan to see what was actually stored
    const { data: recentPlan, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.error('❌ Error fetching recent plan:', error);
      return;
    }
    
    if (!recentPlan) {
      console.log('📭 No plans found in database');
      return;
    }
    
    console.log('📊 Most recent plan data:');
    console.log(`   Title: "${recentPlan.title}"`);
    console.log(`   ID: ${recentPlan.id}`);
    console.log(`   plotLengthMin: ${recentPlan.plotLengthMin} (type: ${typeof recentPlan.plotLengthMin})`);
    console.log(`   plotLengthMax: ${recentPlan.plotLengthMax} (type: ${typeof recentPlan.plotLengthMax})`);
    console.log(`   plotWidth: ${recentPlan.plotWidth} (type: ${typeof recentPlan.plotWidth})`);
    console.log(`   Created: ${new Date(recentPlan.created_at).toLocaleString()}\n`);
    
    // Check if there are any plans with plotLengthMax values
    const { data: plansWithMax, error: maxError } = await supabase
      .from('plans')
      .select('id, title, plotLengthMin, plotLengthMax, created_at')
      .not('plotLengthMax', 'is', null)
      .order('created_at', { ascending: false });
    
    if (maxError) {
      console.error('❌ Error fetching plans with plotLengthMax:', maxError);
      return;
    }
    
    console.log(`📈 Plans with plotLengthMax values: ${plansWithMax?.length || 0}`);
    
    if (plansWithMax && plansWithMax.length > 0) {
      console.log('   Found plans with plotLengthMax:');
      plansWithMax.forEach((plan, index) => {
        console.log(`   ${index + 1}. "${plan.title}" - Min: ${plan.plotLengthMin}, Max: ${plan.plotLengthMax}`);
      });
    } else {
      console.log('   ⚠️  No plans found with plotLengthMax values');
    }
    
    // Check database schema for the plotLengthMax column
    console.log('\n🔧 Checking database schema for plotLengthMax column...');
    
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_column_info', { table_name: 'plans', column_name: 'plotLengthMax' });
    
    if (schemaError) {
      console.log('⚠️  Could not check schema directly, trying alternative method...');
      
      // Try to insert a test record to see if the column exists
      const testData = {
        title: 'TEST_PLOT_LENGTH_MAX',
        fileName: 'test.pdf',
        filePath: '/test/test.pdf',
        fileSize: 1000,
        planType: 'Test',
        storeys: 1,
        plotLengthMin: 10.5,
        plotLengthMax: 20.5,
        status: 'test'
      };
      
      console.log('   Attempting test insert with plotLengthMax...');
      const { data: testInsert, error: insertError } = await supabase
        .from('plans')
        .insert(testData)
        .select()
        .single();
      
      if (insertError) {
        console.error('   ❌ Test insert failed:', insertError.message);
      } else {
        console.log('   ✅ Test insert successful!');
        console.log(`   Test record plotLengthMax: ${testInsert.plotLengthMax}`);
        
        // Clean up test record
        await supabase.from('plans').delete().eq('id', testInsert.id);
        console.log('   🧹 Test record cleaned up');
      }
    } else {
      console.log('   ✅ Schema check successful:', schemaData);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugUploadData();