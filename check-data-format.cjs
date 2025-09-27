// Check actual data format in database
const https = require('https');

function checkDataFormat() {
  const options = {
    hostname: 'arch-plan-01-production.up.railway.app',
    port: 443,
    path: '/api/plans/search?limit=3',
    method: 'GET',
    timeout: 10000
  };

  console.log('🔍 Checking actual data format...');
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        console.log('✅ Found', response.plans?.length || 0, 'plans');
        if (response.plans?.length > 0) {
          response.plans.forEach((plan, index) => {
            console.log(`\nPlan ${index + 1}: ${plan.title}`);
            console.log('outdoorFeatures:', plan.outdoorFeatures);
            console.log('indoorFeatures:', plan.indoorFeatures);
            console.log('typeof outdoorFeatures:', typeof plan.outdoorFeatures);
            console.log('typeof indoorFeatures:', typeof plan.indoorFeatures);
          });
        }
      } else {
        console.log('❌ Failed:', res.statusCode);
      }
    });
  });
  
  req.on('error', err => console.log('❌ Network error:', err.message));
  req.end();
}

checkDataFormat();