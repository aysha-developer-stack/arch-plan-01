import fetch from 'node-fetch';

async function testImageRequest() {
  const planId = 'ce13e9b5-d630-4084-bce3-e06a5c1f6550';
  const imageId = '1758693638175-762380363';
  const url = `http://localhost:5000/api/plans/${planId}/images/${imageId}`;
  
  console.log(`🧪 Testing image request: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual' // Don't follow redirects automatically
    });
    
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.status === 302 || response.status === 301) {
      console.log(`🔄 Redirect to: ${response.headers.get('location')}`);
    } else if (response.status === 404) {
      const errorText = await response.text();
      console.log(`❌ 404 Error response: ${errorText}`);
    } else {
      console.log(`✅ Success! Content-Type: ${response.headers.get('content-type')}`);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testImageRequest();