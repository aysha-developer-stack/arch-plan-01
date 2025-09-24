import { supabase } from './server/db.js';

async function checkDatabaseState() {
  console.log("Checking current database state for all plans...\n");
  
  try {
    const { data: plans, error } = await supabase
      .from('plans')
      .select('id, title, filePath, file_url, file_name')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching plans:', error);
      return;
    }

    console.log(`Found ${plans.length} plans:\n`);
    
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.title || 'Untitled'} (ID: ${plan.id})`);
      console.log(`   filePath: "${plan.filePath}"`);
      console.log(`   file_url: "${plan.file_url}"`);
      console.log(`   file_name: "${plan.file_name}"`);
      console.log('');
    });

    // Check specifically for the plan we're testing
    const testPlan = plans.find(p => p.id === '529010b0-1a20-47af-9594-3c0d23d1cbef');
    if (testPlan) {
      console.log("=== TEST PLAN DETAILS ===");
      console.log(`Title: ${testPlan.title}`);
      console.log(`filePath: "${testPlan.filePath}"`);
      console.log(`file_url: "${testPlan.file_url}"`);
      console.log(`file_name: "${testPlan.file_name}"`);
      
      // Check if file_url is a signed URL or just a filename
      const isSignedUrl = testPlan.file_url && testPlan.file_url.includes('supabase.co');
      console.log(`file_url is signed URL: ${isSignedUrl}`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabaseState();