import axios from 'axios';

// Railway API endpoint
const RAILWAY_API_URL = 'https://arch-plan-01-production.up.railway.app/api';

async function checkRailwayData() {
    console.log('🔍 Checking Railway database content');
    console.log('🌐 API URL:', RAILWAY_API_URL);
    console.log('');

    try {
        // Get all plans without filters
        console.log('📋 Fetching all plans...');
        const response = await axios.get(`${RAILWAY_API_URL}/plans/search`, {
            params: { limit: 10 },
            timeout: 10000
        });

        if (response.status === 200) {
            const { plans, total } = response.data;
            console.log(`✅ SUCCESS: Found ${total} total plans in database`);
            
            if (plans && plans.length > 0) {
                console.log('\n📊 Sample plans and their features:');
                
                plans.slice(0, 5).forEach((plan, index) => {
                    console.log(`\n${index + 1}. Plan: ${plan.title || plan.id}`);
                    console.log(`   🏡 Outdoor Features: ${JSON.stringify(plan.outdoorFeatures || [])}`);
                    console.log(`   🏠 Indoor Features: ${JSON.stringify(plan.indoorFeatures || [])}`);
                    console.log(`   🏗️ Building Type: ${plan.building_type || 'N/A'}`);
                    console.log(`   🛏️ Bedrooms: ${plan.bedrooms || 'N/A'}`);
                });

                // Collect all unique features
                const allOutdoorFeatures = new Set();
                const allIndoorFeatures = new Set();
                
                plans.forEach(plan => {
                    if (plan.outdoorFeatures && Array.isArray(plan.outdoorFeatures)) {
                        plan.outdoorFeatures.forEach(feature => allOutdoorFeatures.add(feature));
                    }
                    if (plan.indoorFeatures && Array.isArray(plan.indoorFeatures)) {
                        plan.indoorFeatures.forEach(feature => allIndoorFeatures.add(feature));
                    }
                });

                console.log('\n🎯 All unique outdoor features in database:');
                console.log(Array.from(allOutdoorFeatures).sort());
                
                console.log('\n🎯 All unique indoor features in database:');
                console.log(Array.from(allIndoorFeatures).sort());

            } else {
                console.log('📭 No plans found in database');
            }
        } else {
            console.log(`❌ FAILED: HTTP ${response.status}`);
        }
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        if (error.response) {
            console.log(`📄 Response status: ${error.response.status}`);
            console.log(`📄 Response data:`, error.response.data);
        }
    }

    console.log('\n🏁 Database check completed!');
}

// Run the check
checkRailwayData().catch(console.error);