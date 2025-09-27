// Using built-in fetch API (Node.js 18+)

const RAILWAY_URL = 'https://arch-plan-01-production.up.railway.app';

async function testRailwayAPI() {
  console.log('🔍 Testing Railway API endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${RAILWAY_URL}/ping`);
    console.log(`   Status: ${healthResponse.status}`);
    if (healthResponse.ok) {
      const healthText = await healthResponse.text();
      console.log(`   Response: ${healthText}`);
    }
    console.log('');

    // Test 2: Get sample plans to see their data structure
    console.log('2. Getting sample plans to inspect data...');
    const sampleResponse = await fetch(`${RAILWAY_URL}/api/plans/search?limit=3`);
    console.log(`   Status: ${sampleResponse.status}`);
    if (sampleResponse.ok) {
      const sampleData = await sampleResponse.json();
      console.log(`   Found ${sampleData.plans?.length || 0} plans`);
      
      if (sampleData.plans && sampleData.plans.length > 0) {
        const firstPlan = sampleData.plans[0];
        console.log('   Sample plan structure:');
        console.log(`     ID: ${firstPlan.id}`);
        console.log(`     Title: ${firstPlan.title}`);
        console.log(`     Outdoor Features: ${JSON.stringify(firstPlan.outdoorFeatures)}`);
        console.log(`     Indoor Features: ${JSON.stringify(firstPlan.indoorFeatures)}`);
        console.log(`     Outdoor Features Type: ${typeof firstPlan.outdoorFeatures}`);
        console.log(`     Indoor Features Type: ${typeof firstPlan.indoorFeatures}`);
      }
    } else {
      const errorText = await sampleResponse.text();
      console.log(`   Error: ${errorText}`);
    }
    console.log('');

    // Test 3: Search with outdoor features
    console.log('3. Testing search with outdoor features...');
    const featuresResponse = await fetch(`${RAILWAY_URL}/api/plans/search?outdoorFeatures=Swimming pool`);
    console.log(`   Status: ${featuresResponse.status}`);
    if (featuresResponse.ok) {
      const featuresData = await featuresResponse.json();
      console.log(`   Found ${featuresData.plans?.length || 0} plans with Swimming pool`);
      console.log(`   Total: ${featuresData.total || 0}`);
    } else {
      const errorText = await featuresResponse.text();
      console.log(`   Error: ${errorText}`);
    }
    console.log('');

    // Test 4: Check actual data structure and all unique features
    console.log('4. Analyzing all unique features in database...');
    try {
      const response = await fetch(`${RAILWAY_URL}/api/plans/search?limit=50`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.plans && data.plans.length > 0) {
          console.log(`   Retrieved ${data.plans.length} plans for analysis`);
          
          // Collect all unique outdoor and indoor features
          const allOutdoorFeatures = new Set();
          const allIndoorFeatures = new Set();
          
          data.plans.forEach((plan) => {
            if (plan.outdoorFeatures && Array.isArray(plan.outdoorFeatures)) {
              plan.outdoorFeatures.forEach(feature => allOutdoorFeatures.add(feature));
            }
            if (plan.indoorFeatures && Array.isArray(plan.indoorFeatures)) {
              plan.indoorFeatures.forEach(feature => allIndoorFeatures.add(feature));
            }
          });
          
          console.log('   All Unique Outdoor Features:', Array.from(allOutdoorFeatures).sort());
          console.log('   All Unique Indoor Features:', Array.from(allIndoorFeatures).sort());
          
          // Test exact feature searches from database
          console.log('\n   Testing exact feature names from database...');
          const testFeatures = Array.from(allOutdoorFeatures).slice(0, 5);
          
          for (const feature of testFeatures) {
            const testResponse = await fetch(`${RAILWAY_URL}/api/plans/search?outdoorFeatures=${encodeURIComponent(feature)}`);
            if (testResponse.ok) {
              const testData = await testResponse.json();
              console.log(`     "${feature}": ${testData.total || 0} plans`);
            }
          }
        } else {
          console.log('   No plans found for analysis');
        }
      }
    } catch (error) {
      console.log('   Error analyzing features:', error.message);
    }

    // Test 5: Debug the actual query being sent
    console.log('5. Testing Query Construction...');
    try {
      // Test with debug logging enabled
      const response = await fetch(`${RAILWAY_URL}/api/plans/search?outdoorFeatures=Swimming%20pool&debug=true`);
      const data = await response.json();
      console.log('   Debug response:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.log('   ❌ Error testing debug query:', error.message);
    }
    console.log('');

    // Test 6: Test different query formats
    console.log('6. Testing Different Query Formats...');
    const testQueries = [
      'outdoorFeatures=Swimming%20pool',
      'outdoorFeatures=Swimming+pool', 
      'outdoorFeatures="Swimming pool"',
      'outdoorFeatures=%22Swimming%20pool%22'
    ];

    for (const query of testQueries) {
      try {
        const response = await fetch(`${RAILWAY_URL}/api/plans/search?${query}`);
        const data = await response.json();
        console.log(`   Query "${query}": ${data.total || 0} plans found`);
      } catch (error) {
        console.log(`   ❌ Error testing query "${query}":`, error.message);
      }
    }
    console.log('');

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testRailwayAPI();