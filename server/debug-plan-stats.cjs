const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function debugPlanStats() {
  console.log('🔍 Debugging get_plan_stats function...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing Supabase environment variables');
    console.log('SUPABASE_URL:', !!supabaseUrl);
    console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    console.log('1. Testing get_plan_stats() function directly...');
    const { data: planStats, error: planStatsError } = await supabase.rpc('get_plan_stats');
    
    if (planStatsError) {
      console.log('❌ get_plan_stats error:', planStatsError);
      return;
    }
    
    console.log('✅ get_plan_stats raw result:');
    console.log('Type:', typeof planStats);
    console.log('Is Array:', Array.isArray(planStats));
    console.log('Data:', JSON.stringify(planStats, null, 2));
    
    if (Array.isArray(planStats) && planStats.length > 0) {
      console.log('\n📊 First element structure:');
      console.log('Keys:', Object.keys(planStats[0]));
      console.log('Values:', planStats[0]);
    }
    
    // Test what the storage class would return
    console.log('\n2. Testing what storage.getPlanStats() would return...');
    const mockStorageResult = planStats;
    console.log('Mock storage result:', JSON.stringify(mockStorageResult, null, 2));
    
    // Check if it has the expected properties
    const expectedProps = ['totalPlans', 'totalDownloads', 'recentUploads'];
    console.log('\n3. Checking for expected properties...');
    
    if (Array.isArray(planStats) && planStats.length > 0) {
      const firstItem = planStats[0];
      expectedProps.forEach(prop => {
        const hasProperty = firstItem.hasOwnProperty(prop);
        console.log(`${hasProperty ? '✅' : '❌'} ${prop}: ${hasProperty ? firstItem[prop] : 'missing'}`);
      });
    } else if (planStats && typeof planStats === 'object') {
      expectedProps.forEach(prop => {
        const hasProperty = planStats.hasOwnProperty(prop);
        console.log(`${hasProperty ? '✅' : '❌'} ${prop}: ${hasProperty ? planStats[prop] : 'missing'}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

debugPlanStats();