import axios from 'axios';

// Railway API endpoint
const RAILWAY_API_URL = 'https://arch-plan-01-production.up.railway.app/api';

async function debugRailwaySearch() {
    console.log('🐛 Debugging Railway search functionality');
    console.log('🌐 API URL:', RAILWAY_API_URL);
    console.log('');

    try {
        // Test 1: Basic search without features (should work)
        console.log('🔍 Test 1: Basic search (no features)');
        const basicResponse = await axios.get(`${RAILWAY_API_URL}/plans/search`, {
            params: { limit: 5 },
            timeout: 10000
        });
        
        if (basicResponse.status === 200) {
            console.log(`✅ Basic search works: Found ${basicResponse.data.total} plans`);
        }

        // Test 2: Search with outdoor features (this should trigger our new code)
        console.log('\n🔍 Test 2: Search with outdoor features (Garage)');
        try {
            const outdoorResponse = await axios.get(`${RAILWAY_API_URL}/plans/search`, {
                params: { 
                    outdoorFeatures: 'Garage',
                    limit: 5 
                },
                timeout: 15000
            });
            
            console.log(`📊 Outdoor search result: ${outdoorResponse.data.total} plans found`);
            console.log(`📄 Response:`, JSON.stringify(outdoorResponse.data, null, 2));
            
        } catch (outdoorError) {
            console.log('❌ Outdoor search failed:');
            console.log(`   Status: ${outdoorError.response?.status}`);
            console.log(`   Message: ${outdoorError.message}`);
            console.log(`   Data:`, outdoorError.response?.data);
        }

        // Test 3: Search with indoor features
        console.log('\n🔍 Test 3: Search with indoor features (Ensuite)');
        try {
            const indoorResponse = await axios.get(`${RAILWAY_API_URL}/plans/search`, {
                params: { 
                    indoorFeatures: 'Ensuite',
                    limit: 5 
                },
                timeout: 15000
            });
            
            console.log(`📊 Indoor search result: ${indoorResponse.data.total} plans found`);
            console.log(`📄 Response:`, JSON.stringify(indoorResponse.data, null, 2));
            
        } catch (indoorError) {
            console.log('❌ Indoor search failed:');
            console.log(`   Status: ${indoorError.response?.status}`);
            console.log(`   Message: ${indoorError.message}`);
            console.log(`   Data:`, indoorError.response?.data);
        }

        // Test 4: Check if the server is using the updated code
        console.log('\n🔍 Test 4: Testing server response headers and timing');
        const testResponse = await axios.get(`${RAILWAY_API_URL}/plans/search`, {
            params: { 
                outdoorFeatures: 'Garage',
                limit: 1 
            },
            timeout: 15000
        });
        
        console.log('📋 Response headers:', testResponse.headers);
        console.log('⏱️ Response time: Fast (likely cached) or slow (processing)?');

    } catch (error) {
        console.log(`❌ DEBUG ERROR: ${error.message}`);
        if (error.response) {
            console.log(`📄 Response status: ${error.response.status}`);
            console.log(`📄 Response headers:`, error.response.headers);
            console.log(`📄 Response data:`, error.response.data);
        }
    }

    console.log('\n🏁 Debug completed!');
    console.log('\n💡 Next steps:');
    console.log('1. Check Railway deployment logs for any errors');
    console.log('2. Verify the latest code is deployed');
    console.log('3. Check if the database schema matches our expectations');
}

// Run the debug
debugRailwaySearch().catch(console.error);