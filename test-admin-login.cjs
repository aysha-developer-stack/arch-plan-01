const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('Testing admin login API...');
    
    const response = await axios.post('http://localhost:5000/api/admin/login', {
      email: 'archplan.vivid@gmail.com',
      password: 'Vividarch4321$$'
    }, {
      withCredentials: true
    });
    
    console.log('✅ Login successful!');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    console.log('Response data keys:', Object.keys(response.data));
    console.log('Has success field:', 'success' in response.data);
    console.log('Has token field:', 'token' in response.data);
    console.log('Has message field:', 'message' in response.data);
    
    // Test auth check endpoint
    console.log('\n🔍 Testing auth check...');
    const cookies = response.headers['set-cookie'];
    const authResponse = await axios.get('http://localhost:5000/api/admin/check-auth', {
      headers: {
        Cookie: cookies ? cookies.join('; ') : ''
      },
      withCredentials: true
    });
    console.log('Auth check response:', JSON.stringify(authResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Login failed!');
    console.error('Status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    console.error('Error message:', error.message);
  }
}

testAdminLogin();