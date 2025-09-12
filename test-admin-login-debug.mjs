import fetch from 'node-fetch';

const testAdminLogin = async () => {
  try {
    console.log('🧪 Testing admin login with debug logging...');
    
    const response = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'archplan.vivid@gmail.com',
        password: 'Vividarch4321$$'
      })
    });

    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Data:', data);
    
    if (response.ok) {
      console.log('✅ Login successful!');
    } else {
      console.log('❌ Login failed:', data.error);
    }
    
  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
};

testAdminLogin();