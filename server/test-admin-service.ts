import { getAllAdmins, getAdminById, authenticateAdmin } from './src/services/adminService';

async function testAdminService() {
  console.log('🧪 Testing Admin Service Functions...\n');

  try {
    // Test 1: Get all admins
    console.log('1️⃣ Testing getAllAdmins()...');
    const allAdmins = await getAllAdmins();
    console.log('✅ All admins:', allAdmins);
    console.log('📊 Total admin count:', allAdmins?.length || 0);
    console.log('');

    // Test 2: Get admin by ID
    console.log('2️⃣ Testing getAdminById()...');
    const adminId = '829aa91c-5eef-4465-bbaa-bb32b2c2240c';
    const adminById = await getAdminById(adminId);
    console.log('✅ Admin by ID:', adminById);
    console.log('');

    // Test 3: Authenticate admin
    console.log('3️⃣ Testing authenticateAdmin()...');
    const authResult = await authenticateAdmin('archplan.vivid@gmail.com', 'ArchPlan2024!');
    console.log('✅ Authentication result:', {
      admin: authResult.admin,
      sessionExists: !!authResult.session
    });
    console.log('');

    console.log('🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testAdminService();