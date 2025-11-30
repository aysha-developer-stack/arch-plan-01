import { authenticateAdmin } from './src/services/adminService';
async function testAdminLogin() {
    try {
        console.log('🔑 Testing admin login...');
        const email = 'archplan.vivid@gmail.com';
        const password = 'Vividarch4321$$';
        console.log(`📧 Email: ${email}`);
        console.log(`🔒 Password: ${password}`);
        const result = await authenticateAdmin(email, password);
        console.log('✅ Login successful!');
        console.log('👤 Admin:', result.admin);
        console.log('🔑 Session:', result.session);
        return true;
    }
    catch (error) {
        console.error('❌ Login failed:', error.message);
        console.error('Full error:', error);
        return false;
    }
}
testAdminLogin()
    .then(success => {
    if (success) {
        console.log('\n🎉 Admin login is working correctly!');
        console.log('You can now log in at http://localhost:5000/admin/login');
    }
    else {
        console.log('\n❌ Admin login is still not working.');
        console.log('Please check the error messages above for more details.');
    }
});
//# sourceMappingURL=test-admin-login.js.map