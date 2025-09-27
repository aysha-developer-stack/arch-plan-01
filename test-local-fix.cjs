// Test local server with the fixed array syntax
const http = require('http');

function testSearch(featureType, featureValue) {
  const path = `/api/plans/search?${featureType}=${encodeURIComponent(featureValue)}`;
  
  console.log(`🔍 Testing Local: ${featureType}=${featureValue}`);
  
  http.get({
    hostname: 'localhost',
    port: 5000,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log(`✅ Found ${parsed.plans.length} plans with '${featureValue}'`);
        if (parsed.plans.length > 0) {
          console.log('Sample result:', parsed.plans[0].title);
          console.log('Features:', {
            outdoor: parsed.plans[0].outdoorFeatures,
            indoor: parsed.plans[0].indoorFeatures
          });
        }
      } catch (err) {
        console.error('❌ Parse error:', err.message);
        console.log('Raw response:', data.substring(0, 100));
      }
    });
  }).on('error', err => {
    console.error('❌ Network error:', err.message);
  });
}

// Test all features
testSearch('outdoorFeatures', 'Swimming pool');
setTimeout(() => testSearch('outdoorFeatures', 'Garage'), 1000);
setTimeout(() => testSearch('indoorFeatures', 'Ensuite'), 2000);
setTimeout(() => testSearch('indoorFeatures', 'Walk-in wardrobe'), 3000);