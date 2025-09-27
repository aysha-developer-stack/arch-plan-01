import fetch from 'node-fetch';
import fs from 'fs';

const LOG_FILE = 'api-test-results.log';
// Clear log file at the start
fs.writeFileSync(LOG_FILE, '');

const log = (message) => {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
};

async function testApiEndpoint() {
  log('🔍 Testing database features via API endpoint...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/test-db-features');
    
    if (!response.ok) {
      log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    
    if (data.success) {
      log('✅ API call successful!');
      log(`📊 Results:`);
      log(`   Total Plans: ${data.results.totalPlans}`);
      
      if (data.results.samplePlan) {
        log(`   Sample Plan:`);
        log(`     - ID: ${data.results.samplePlan.id}`);
        log(`     - Title: ${data.results.samplePlan.title}`);
        log(`     - Outdoor Features: ${JSON.stringify(data.results.samplePlan.outdoorFeatures)}`);
        log(`     - Indoor Features: ${JSON.stringify(data.results.samplePlan.indoorFeatures)}`);
      }
      
      log(`   Outdoor Search (Swimming pool): ${data.results.outdoorSearchCount} plans found`);
      log(`   Indoor Search (Study / Home office): ${data.results.indoorSearchCount} plans found`);
      
      log('\n🎉 Database feature tests completed successfully!');
    } else {
      log(`❌ API returned error: ${data.message}`);
    }
    
  } catch (error) {
    log(`❌ Error calling API: ${error.message}`);
  }
}

// Run the test
testApiEndpoint().then(() => {
  log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  log(`❌ Test failed: ${error.message}`);
  process.exit(1);
});
