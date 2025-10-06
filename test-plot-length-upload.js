import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPlotLengthUpload() {
  console.log('🧪 Testing plotLengthMin and plotLengthMax upload...\n');

  // Test data with both plotLengthMin and plotLengthMax
  const testPlanData = {
    title: 'Test Plan - Plot Length Fields',
    description: 'Test plan to verify plotLengthMin and plotLengthMax storage',
    architect: 'Test Architect',
    plotLengthMin: 25.5,
    plotLengthMax: 35.8,
    plotWidth: 15.2,
    coveredArea: 120.5,
    planType: 'Residential',
    storeys: 2,
    bedrooms: 3,
    building_type: 'Residential',
    file_url: 'test-file-url.pdf'
  };

  try {
    // Insert test plan
    console.log('📤 Inserting test plan with plot length values...');
    const { data: insertedPlan, error: insertError } = await supabase
      .from('plans')
      .insert([testPlanData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      return;
    }

    console.log('✅ Test plan inserted successfully!');
    console.log(`📋 Plan ID: ${insertedPlan.id}`);
    console.log(`📏 plotLengthMin: ${insertedPlan.plotLengthMin}`);
    console.log(`📏 plotLengthMax: ${insertedPlan.plotLengthMax}`);
    console.log(`📐 plotWidth: ${insertedPlan.plotWidth}`);
    console.log(`🏠 coveredArea: ${insertedPlan.coveredArea}\n`);

    // Verify the data was stored correctly
    console.log('🔍 Verifying stored data...');
    const { data: retrievedPlan, error: retrieveError } = await supabase
      .from('plans')
      .select('id, title, plotLengthMin, plotLengthMax, plotWidth, coveredArea, planType, storeys, bedrooms')
      .eq('id', insertedPlan.id)
      .single();

    if (retrieveError) {
      console.error('❌ Retrieve failed:', retrieveError);
      return;
    }

    console.log('✅ Data verification successful!');
    console.log('📊 Retrieved values:');
    console.log(`   plotLengthMin: ${retrievedPlan.plotLengthMin} (expected: ${testPlanData.plotLengthMin})`);
    console.log(`   plotLengthMax: ${retrievedPlan.plotLengthMax} (expected: ${testPlanData.plotLengthMax})`);
    console.log(`   plotWidth: ${retrievedPlan.plotWidth} (expected: ${testPlanData.plotWidth})`);
    console.log(`   coveredArea: ${retrievedPlan.coveredArea} (expected: ${testPlanData.coveredArea})`);
    console.log(`   planType: ${retrievedPlan.planType} (expected: ${testPlanData.planType})`);
    console.log(`   storeys: ${retrievedPlan.storeys} (expected: ${testPlanData.storeys})`);
    console.log(`   bedrooms: ${retrievedPlan.bedrooms} (expected: ${testPlanData.bedrooms})\n`);

    // Check if values match
    const valuesMatch = 
      retrievedPlan.plotLengthMin === testPlanData.plotLengthMin &&
      retrievedPlan.plotLengthMax === testPlanData.plotLengthMax &&
      retrievedPlan.plotWidth === testPlanData.plotWidth &&
      retrievedPlan.coveredArea === testPlanData.coveredArea;

    if (valuesMatch) {
      console.log('🎉 SUCCESS: All plot length and additional fields are being stored correctly!');
    } else {
      console.log('⚠️  WARNING: Some values don\'t match expected results');
    }

    // Clean up - delete the test plan
    console.log('\n🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('plans')
      .delete()
      .eq('id', insertedPlan.id);

    if (deleteError) {
      console.error('❌ Failed to delete test plan:', deleteError);
      console.log(`⚠️  Please manually delete plan with ID: ${insertedPlan.id}`);
    } else {
      console.log('✅ Test plan deleted successfully');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testPlotLengthUpload();