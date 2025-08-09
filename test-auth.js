const axios = require('axios');
const fs = require('fs');

const API_BASE = 'http://localhost:5000/api/admin';

async function testAuth() {
  try {
    console.log('Testing admin authentication flow...');
    
    // 1. Test login with invalid credentials
    console.log('\n1. Testing login with invalid credentials...');
    try {
      await axios.post(`${API_BASE}/login`, {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      });
      console.error('❌ Test failed: Should not allow login with invalid credentials');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Test passed: Invalid credentials rejected');
      } else {
        console.error('❌ Test failed with unexpected error:', error.message);
      }
    }

    // 2. Test login with valid credentials (replace with actual admin credentials)
    console.log('\n2. Testing login with valid credentials...');
    let cookies;
    try {
      const response = await axios.post(`${API_BASE}/login`, {
        email: 'admin@example.com', // Replace with actual admin email
        password: 'adminpassword'   // Replace with actual admin password
      }, {
        withCredentials: true
      });
      
      cookies = response.headers['set-cookie'];
      console.log('✅ Test passed: Login successful');
      console.log('   Response:', response.data);
    } catch (error) {
      console.error('❌ Test failed: Login with valid credentials failed');
      console.error('   Error:', error.response?.data || error.message);
      return;
    }

    // 3. Test protected route with valid session
    console.log('\n3. Testing protected route with valid session...');
    try {
      const response = await axios.get(`${API_BASE}/check-auth`, {
        withCredentials: true,
        headers: {
          Cookie: cookies ? cookies.join('; ') : ''
        }
      });
      console.log('✅ Test passed: Successfully accessed protected route');
      console.log('   Response:', response.data);
    } catch (error) {
      console.error('❌ Test failed: Could not access protected route');
      console.error('   Error:', error.response?.data || error.message);
    }

    // 4. Test logout
    console.log('\n4. Testing logout...');
    try {
      const response = await axios.post(`${API_BASE}/logout`, {}, {
        withCredentials: true,
        headers: {
          Cookie: cookies ? cookies.join('; ') : ''
        }
      });
      console.log('✅ Test passed: Logout successful');
      console.log('   Response:', response.data);
    } catch (error) {
      console.error('❌ Test failed: Logout failed');
      console.error('   Error:', error.response?.data || error.message);
    }

    // 5. Verify session is invalid after logout
    console.log('\n5. Verifying session is invalid after logout...');
    try {
      await axios.get(`${API_BASE}/check-auth`, {
        withCredentials: true,
        headers: {
          Cookie: cookies ? cookies.join('; ') : ''
        }
      });
      console.error('❌ Test failed: Session still valid after logout');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Test passed: Session invalid after logout');
      } else {
        console.error('❌ Test failed with unexpected error:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Test suite failed with error:', error);
  }
}

testAuth();
