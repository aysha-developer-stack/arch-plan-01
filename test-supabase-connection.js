import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase URL or key. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  try {
    // Fetch all plans from the database
    console.log('Fetching all plans...');
    const { data: plans, error } = await supabase.from('plans').select('*');
    
    if (error) {
      console.error('❌ Error fetching plans:', error);
      return;
    }
    
    console.log(`✅ Found ${plans.length} total plans in database\n`);
    
    if (plans.length > 0) {
      const samplePlan = plans[0];
      console.log('Sample plan structure:');
      console.log(`- ID: ${samplePlan.id}`);
      console.log(`- Title: ${samplePlan.title}`);
      console.log(`- Outdoor Features: ${JSON.stringify(samplePlan.outdoorFeatures)}`);
      console.log(`- Indoor Features: ${JSON.stringify(samplePlan.indoorFeatures)}`);
    }
    
    console.log('🎉 Supabase connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during Supabase connection test:', error);
  }
}

// Run the test
testSupabaseConnection().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
