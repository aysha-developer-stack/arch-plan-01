// Test search with actual features from the database
const https = require('https');

function testSearch(featureType, featureValue) {
  const options = {
    hostname: 'arch-plan-01-production.up.railway.app',
    port: 443,
    path: `/api/plans/search?${featureType}=${encodeURIComponent(featureValue)}`,
    method: 'GET',
    timeout: 10000
  };

  console.log(`🔍 Testing: ${featureType}=${featureValue}`);
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        console.log(`✅ Found ${response.plans?.length || 0} plans with '${featureValue}'`);
        if (response.plans?.length > 0) {
          console.log('📋 Matching plans:', response.plans.map(p => p.title));
        }
      } else {
        console.log(`❌ Failed: ${res.statusCode}`);
      }
      console.log('');
    });
  });
  
  req.on('error', err => console.log('❌ Network error:', err.message));
  req.end();
}

// Test with actual features from the database
setTimeout(() => testSearch('outdoorFeatures', 'Swimming pool'), 0);
setTimeout(() => testSearch('outdoorFeatures', 'Garage'), 1000);
setTimeout(() => testSearch('indoorFeatures', 'Ensuite'), 2000);
setTimeout(() => testSearch('indoorFeatures', 'Walk-in wardrobe'), 3000);