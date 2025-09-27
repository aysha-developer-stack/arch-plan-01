// Check Railway deployment data format
const https = require('https');

https.get('https://arch-plan-01-production.up.railway.app/api/plans/search?limit=5', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Sample plans with features:');
      parsed.plans.forEach(plan => {
        console.log(`Title: ${plan.title}`);
        console.log(`Outdoor: ${JSON.stringify(plan.outdoorFeatures)}`);
        console.log(`Indoor: ${JSON.stringify(plan.indoorFeatures)}`);
        console.log('---');
      });
    } catch (err) {
      console.error('Parse error:', err.message);
      console.log('Raw data:', data.substring(0, 200));
    }
  });
}).on('error', err => console.error('Network error:', err.message));