import { supabase } from './server/db.ts';

async function debugPlanIds() {
  try {
    console.log('🔍 Checking plan IDs in database...');
    
    const { data, error } = await supabase
      .from('plans')
      .select('id, title, file_url')
      .limit(10);
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log('\n📋 Sample plan IDs in database:');
    data.forEach((plan, index) => {
      console.log(`${index + 1}. ID: ${plan.id}`);
      console.log(`   Title: ${plan.title}`);
      console.log(`   File URL: ${plan.file_url ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Check total count
    const { count } = await supabase
      .from('plans')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total plans in database: ${count}`);
    
    // Check if the specific problematic ID exists
    const problemId = '529010b0-1a20-47af-9594-3c0d23d1cbef';
    const { data: specificPlan, error: specificError } = await supabase
      .from('plans')
      .select('id, title')
      .eq('id', problemId)
      .single();
    
    if (specificError) {
      console.log(`❌ Plan with ID ${problemId} NOT FOUND`);
      console.log('Error:', specificError.message);
    } else {
      console.log(`✅ Plan with ID ${problemId} FOUND: ${specificPlan.title}`);
    }
    
  } catch (err) {
    console.error('❌ Script error:', err);
  }
}

debugPlanIds();