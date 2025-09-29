import axios from 'axios';

// Railway API endpoint
const RAILWAY_API_URL = 'https://arch-plan-01-production.up.railway.app/api';

async function testRailwayFeatures() {
    console.log('🧪 Testing Railway deployment - Indoor/Outdoor Features Search');
    console.log('🌐 API URL:', RAILWAY_API_URL);
    console.log('');

    const testCases = [
        {
            name: 'Test 1: Single Outdoor Feature (Garage)',
            params: {
                outdoorFeatures: 'Garage'
            }
        },
        {
            name: 'Test 2: Single Indoor Feature (Ensuite)',
            params: {
                indoorFeatures: 'Ensuite'
            }
        },
        {
            name: 'Test 3: Multiple Outdoor Features (AND logic)',
            params: {
                outdoorFeatures: 'Garage,Balcony'
            }
        },
        {
            name: 'Test 4: Multiple Indoor Features (AND logic)',
            params: {
                indoorFeatures: 'Ensuite,Study / Home office'
            }
        },
        {
            name: 'Test 5: Both Indoor and Outdoor Features',
            params: {
                outdoorFeatures: 'Garage',
                indoorFeatures: 'Ensuite'
            }
        },
        {
            name: 'Test 6: New Features Added',
            params: {
                outdoorFeatures: 'Outdoor kitchen',
                indoorFeatures: 'Wine cellar'
            }
        }
    ];

    for (const testCase of testCases) {
        console.log(`\n🔍 ${testCase.name}`);
        console.log('   Parameters:', JSON.stringify(testCase.params, null, 2));
        
        try {
            const response = await axios.get(`${RAILWAY_API_URL}/plans/search`, {
                params: testCase.params,
                timeout: 10000
            });

            if (response.status === 200) {
                const { plans, total } = response.data;
                console.log(`   ✅ SUCCESS: Found ${total} plans`);
                
                if (plans && plans.length > 0) {
                    console.log(`   📋 First plan: ${plans[0].title || plans[0].id}`);
                    
                    // Verify the features are actually present in the results
                    const firstPlan = plans[0];
                    if (testCase.params.outdoorFeatures) {
                        const outdoorFeatures = testCase.params.outdoorFeatures.split(',').map(f => f.trim());
                        const planOutdoorFeatures = firstPlan.outdoorFeatures || [];
                        console.log(`   🏡 Plan outdoor features: ${JSON.stringify(planOutdoorFeatures)}`);
                        
                        const hasAllOutdoor = outdoorFeatures.every(feature => 
                            planOutdoorFeatures.includes(feature)
                        );
                        console.log(`   ${hasAllOutdoor ? '✅' : '❌'} AND logic check (outdoor): ${hasAllOutdoor ? 'PASSED' : 'FAILED'}`);
                    }
                    
                    if (testCase.params.indoorFeatures) {
                        const indoorFeatures = testCase.params.indoorFeatures.split(',').map(f => f.trim());
                        const planIndoorFeatures = firstPlan.indoorFeatures || [];
                        console.log(`   🏠 Plan indoor features: ${JSON.stringify(planIndoorFeatures)}`);
                        
                        const hasAllIndoor = indoorFeatures.every(feature => 
                            planIndoorFeatures.includes(feature)
                        );
                        console.log(`   ${hasAllIndoor ? '✅' : '❌'} AND logic check (indoor): ${hasAllIndoor ? 'PASSED' : 'FAILED'}`);
                    }
                }
            } else {
                console.log(`   ❌ FAILED: HTTP ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            if (error.response) {
                console.log(`   📄 Response status: ${error.response.status}`);
                console.log(`   📄 Response data:`, error.response.data);
            }
        }
    }

    console.log('\n🏁 Railway testing completed!');
}

// Run the test
testRailwayFeatures().catch(console.error);