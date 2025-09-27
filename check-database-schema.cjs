const { createClient } = require('@supabase/supabase-js');

// Use Railway environment variables directly
const supabase = createClient(
  'https://zxevebnmhikhdszwtiqk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZXZlYm5taGlraGRzend0aXFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODEzMjU3MywiZXhwIjoyMDczNzA4NTczfQ.VWjqRnMGqw8dExlL0AI4nMZxKcpuYjr5GmNaVxfPn4g'
);

async function checkSchema() {
  console.log('🔍 Checking database schema and data format...\n');
  
  // Check actual data format first
  const { data: plans, error: dataError } = await supabase
    .from('plans')
    .select('id, title, outdoorFeatures, indoorFeatures')
    .limit(5);
    
  if (dataError) {
    console.error('Data error:', dataError);
    return;
  }
  
  console.log('📋 Sample Data:');
  plans.forEach((plan, i) => {
    console.log(`\nPlan ${i + 1} (${plan.id}):`);
    console.log(`  Title: ${plan.title}`);
    console.log(`  Outdoor Features: ${JSON.stringify(plan.outdoorFeatures)}`);
    console.log(`  Outdoor Features Type: ${typeof plan.outdoorFeatures}`);
    console.log(`  Indoor Features: ${JSON.stringify(plan.indoorFeatures)}`);
    console.log(`  Indoor Features Type: ${typeof plan.indoorFeatures}`);
    
    // Check if it's an array
    console.log(`  Outdoor Features is Array: ${Array.isArray(plan.outdoorFeatures)}`);
    console.log(`  Indoor Features is Array: ${Array.isArray(plan.indoorFeatures)}`);
  });
  
  // Try a direct SQL query to check column types
  console.log('\n🔍 Checking column types with direct SQL...');
  const { data: columnInfo, error: sqlError } = await supabase.rpc('get_column_info');
  
  if (sqlError) {
    console.log('SQL RPC error (expected if function doesn\'t exist):', sqlError.message);
  } else {
    console.log('Column info:', columnInfo);
  }
}

checkSchema().catch(console.error);