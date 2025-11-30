// Debug script to check localStorage contents
// Run this in the browser console after logging in

console.log('=== localStorage Debug ===');

// Check if user data exists
const userData = localStorage.getItem('user');
console.log('Raw user data from localStorage:', userData);

if (userData) {
  try {
    const parsedUser = JSON.parse(userData);
    console.log('Parsed user data:', parsedUser);
    console.log('User name:', parsedUser.name);
    console.log('User name type:', typeof parsedUser.name);
    console.log('User name length:', parsedUser.name ? parsedUser.name.length : 'N/A');
    console.log('Is name truthy?', !!parsedUser.name);
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
} else {
  console.log('No user data found in localStorage');
}

// Check all localStorage keys
console.log('All localStorage keys:', Object.keys(localStorage));
console.log('All localStorage contents:');
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    console.log(`${key}:`, localStorage.getItem(key));
  }
}