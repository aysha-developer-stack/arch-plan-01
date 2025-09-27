import { getStorage } from './server/storage.js';

async function testFeaturesSearch() {
  console.log('🔍 Testing indoor/outdoor features search functionality...\n');
  
  const storage = getStorage();
  
  try {
    // Test 1: Search with no filters (should return all plans)
    console.log('Test 1: Search with no filters');
    const allPlans = await storage.searchPlans({});
    console.log(`✅ Found ${allPlans.total} total plans in database\n`);
    
    if (allPlans.plans.length > 0) {
      const samplePlan = allPlans.plans[0];
      console.log('Sample plan structure:');
      console.log(`- ID: ${samplePlan.id}`);
      console.log(`- Title: ${samplePlan.title}`);
      console.log(`- Outdoor Features: ${JSON.stringify(samplePlan.outdoorFeatures)}`);
      console.log(`- Indoor Features: ${JSON.stringify(samplePlan.indoorFeatures)}`);
      console.log(`- Building Type: ${samplePlan.building_type || samplePlan.planType}`);
      console.log(`- Storeys: ${samplePlan.storeys}`);
      console.log(`- Bedrooms: ${samplePlan.bedrooms}`);
      console.log(`- Toilets: ${samplePlan.toilets}\n`);
    }
    
    // Test 2: Search with outdoor features
    console.log('Test 2: Search with outdoor features (Swimming pool)');
    const outdoorSearch = await storage.searchPlans({
      outdoorFeatures: 'Swimming pool'
    });
    console.log(`✅ Found ${outdoorSearch.total} plans with Swimming pool\n`);
    
    // Test 3: Search with indoor features
    console.log('Test 3: Search with indoor features (Study / Home office)');
    const indoorSearch = await storage.searchPlans({
      indoorFeatures: 'Study / Home office'
    });
    console.log(`✅ Found ${indoorSearch.total} plans with Study / Home office\n`);
    
    // Test 4: Search with multiple outdoor features
    console.log('Test 4: Search with multiple outdoor features (Swimming pool,Garage)');
    const multiOutdoorSearch = await storage.searchPlans({
      outdoorFeatures: 'Swimming pool,Garage'
    });
    console.log(`✅ Found ${multiOutdoorSearch.total} plans with Swimming pool AND Garage\n`);
    
    // Test 5: Search with multiple indoor features
    console.log('Test 5: Search with multiple indoor features (Study / Home office,Ensuite)');
    const multiIndoorSearch = await storage.searchPlans({
      indoorFeatures: 'Study / Home office,Ensuite'
    });
    console.log(`✅ Found ${multiIndoorSearch.total} plans with Study / Home office AND Ensuite\n`);
    
    // Test 6: Search with both indoor and outdoor features
    console.log('Test 6: Search with both indoor and outdoor features');
    const combinedSearch = await storage.searchPlans({
      outdoorFeatures: 'Swimming pool',
      indoorFeatures: 'Study / Home office'
    });
    console.log(`✅ Found ${combinedSearch.total} plans with Swimming pool AND Study / Home office\n`);
    
    // Test 7: Search with other filters combined
    console.log('Test 7: Search with features + other filters (bedrooms=3)');
    const combinedFiltersSearch = await storage.searchPlans({
      outdoorFeatures: 'Garage',
      bedrooms: '3'
    });
    console.log(`✅ Found ${combinedFiltersSearch.total} plans with Garage AND 3 bedrooms\n`);
    
    console.log('🎉 All feature search tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during feature search tests:', error);
  }
}

// Run the test
testFeaturesSearch().then(() => {
  console.log('\n✅ Test completed');
  setTimeout(() => process.exit(0), 2000); // Add a delay before exiting
}).catch(error => {
  console.error('❌ Test failed:', error);
  setTimeout(() => process.exit(1), 2000); // Add a delay before exiting
});
