import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config();

const LOG_FILE = 'test-results.log';
// Clear log file at the start
fs.writeFileSync(LOG_FILE, '');

const log = (message) => fs.appendFileSync(LOG_FILE, message + '\n');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  log('❌ Missing Supabase URL or key. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDbFeatures() {
  log('🔍 Testing database features directly...\n');
  
  try {
    // Test 1: Fetch all plans from the database
    log('Test 1: Fetching all plans');
    const { data: plans, error } = await supabase.from('plans').select('*');
    
    if (error) {
      log('❌ Error fetching plans: ' + JSON.stringify(error));
      return;
    }
    
    log(`✅ Found ${plans.length} total plans in database\n`);
    
    if (plans.length > 0) {
      const samplePlan = plans[0];
      log('Sample plan structure:');
      log(`- ID: ${samplePlan.id}`);
      log(`- Title: ${samplePlan.title}`);
      log(`- Outdoor Features: ${JSON.stringify(samplePlan.outdoorFeatures)}`);
      log(`- Indoor Features: ${JSON.stringify(samplePlan.indoorFeatures)}`);
      log(`- Building Type: ${samplePlan.building_type || samplePlan.planType}`);
      log(`- Storeys: ${samplePlan.storeys}`);
      log(`- Bedrooms: ${samplePlan.bedrooms}`);
      log(`- Toilets: ${samplePlan.toilets}\n`);
    }
    
    // Test 2: Search for plans with specific outdoor features
    log('Test 2: Searching for plans with outdoor features (Swimming pool)');
    const { data: outdoorPlans, error: outdoorError } = await supabase
      .from('plans')
      .select('*')
      .contains('outdoorFeatures', ['Swimming pool']);
      
    if (outdoorError) {
      log('❌ Error searching for outdoor features: ' + JSON.stringify(outdoorError));
    } else {
      log(`✅ Found ${outdoorPlans.length} plans with Swimming pool\n`);
    }
    
    // Test 3: Search for plans with specific indoor features
    log('Test 3: Searching for plans with indoor features (Study / Home office)');
    const { data: indoorPlans, error: indoorError } = await supabase
      .from('plans')
      .select('*')
      .contains('indoorFeatures', ['Study / Home office']);
      
    if (indoorError) {
      log('❌ Error searching for indoor features: ' + JSON.stringify(indoorError));
    } else {
      log(`✅ Found ${indoorPlans.length} plans with Study / Home office\n`);
    }
    
    log('🎉 All database feature tests completed successfully!');
    
  } catch (error) {
    log('❌ Error during database feature tests: ' + JSON.stringify(error));
  }
}

// Run the test
testDbFeatures().then(() => {
  log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  log('❌ Test failed: ' + JSON.stringify(error));
  process.exit(1);
});
