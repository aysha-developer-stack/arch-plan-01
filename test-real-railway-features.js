import axios from 'axios';

// Railway API endpoint
const RAILWAY_API_URL = 'https://arch-plan-01-production.up.railway.app/api';

async function testRealRailwayFeatures() {
    console.log('🧪 Testing Railway deployment with REAL features');
    console.log('🌐 API URL:', RAILWAY_API_URL);
    console.log('');

    const testCases = [
        {
            name: 'Test 1: Single Outdoor Feature (Garage) - EXISTS',
            params: {
                outdoorFeatures: 'Garage'
            },
            expectedPlans: 1 // Should find "Master Plan"
        },
        {
            name: 'Test 2: Single Indoor Feature (Ensuite) - EXISTS',
            params: {
                indoorFeatures: 'Ensuite'
            },
            expectedPlans: 2 // Should find both plans
        },
        {
            name: 'Test 3: Multiple Outdoor Features (AND logic) - EXISTS',
            params: {
                outdoorFeatures: 'Garage,Balcony'
            },
            expectedPlans: 1 // Should find "Master Plan" (has both)
        },
        {
            name: 'Test 4: Multiple Indoor Features (AND logic) - EXISTS',
            params: {
                indoorFeatures: 'Ensuite,Study / Home office'
            },
            expectedPlans: 1 // Should find "Master Plan" (has both)
        },
        {
            name: 'Test 5: Both Indoor and Outdoor Features - EXISTS',
            params: {
                outdoorFeatures: 'Garage',
                indoorFeatures: 'Ensuite'
            },
            expectedPlans: 1 // Should find "Master Plan"
        },
        {
            name: 'Test 6: Feature that exists in only one plan',
            params: {
                outdoorFeatures: 'Carport'
            },
            expectedPlans: 1 // Should find "Internal Alterations and Addition"
        },
        {
            name: 'Test 7: AND logic - should find NO results',
            params: {
                outdoorFeatures: 'Garage,Carport'
            },
            expectedPlans: 0 // No plan has both Garage AND Carport
        }
    ];

    let passedTests = 0;
    let totalTests = testCases.length;

    for (const testCase of testCases) {
        console.log(`\n🔍 ${testCase.name}`);
        console.log('   Parameters:', JSON.stringify(testCase.params, null, 2));
        console.log(`   Expected: ${testCase.expectedPlans} plans`);
        
        try {
            const response = await axios.get(`${RAILWAY_API_URL}/plans/search`, {
                params: testCase.params,
                timeout: 10000
            });

            if (response.status === 200) {
                const { plans, total } = response.data;
                console.log(`   📊 RESULT: Found ${total} plans`);
                
                // Check if result matches expectation
                const testPassed = total === testCase.expectedPlans;
                console.log(`   ${testPassed ? '✅' : '❌'} TEST ${testPassed ? 'PASSED' : 'FAILED'}`);
                
                if (testPassed) {
                    passedTests++;
                }
                
                if (plans && plans.length > 0) {
                    plans.forEach((plan, index) => {
                        console.log(`   📋 Plan ${index + 1}: ${plan.title}`);
                        
                        // Verify the features are actually present in the results
                        if (testCase.params.outdoorFeatures) {
                            const searchFeatures = testCase.params.outdoorFeatures.split(',').map(f => f.trim());
                            const planFeatures = plan.outdoorFeatures || [];
                            console.log(`   🏡 Outdoor: ${JSON.stringify(planFeatures)}`);
                            
                            const hasAllFeatures = searchFeatures.every(feature => 
                                planFeatures.includes(feature)
                            );
                            console.log(`   ${hasAllFeatures ? '✅' : '❌'} AND logic (outdoor): ${hasAllFeatures ? 'CORRECT' : 'INCORRECT'}`);
                        }
                        
                        if (testCase.params.indoorFeatures) {
                            const searchFeatures = testCase.params.indoorFeatures.split(',').map(f => f.trim());
                            const planFeatures = plan.indoorFeatures || [];
                            console.log(`   🏠 Indoor: ${JSON.stringify(planFeatures)}`);
                            
                            const hasAllFeatures = searchFeatures.every(feature => 
                                planFeatures.includes(feature)
                            );
                            console.log(`   ${hasAllFeatures ? '✅' : '❌'} AND logic (indoor): ${hasAllFeatures ? 'CORRECT' : 'INCORRECT'}`);
                        }
                    });
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
    console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED! The array operator fix is working correctly on Railway!');
    } else {
        console.log('⚠️ Some tests failed. Please check the results above.');
    }
}

// Run the test
testRealRailwayFeatures().catch(console.error);