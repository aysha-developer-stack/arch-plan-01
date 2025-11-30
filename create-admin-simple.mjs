import dotenv from 'dotenv';
import { createAdmin } from './server/src/services/adminService.ts';

// Load environment variables
dotenv.config();

async function createAdminUser() {
  try {
    console.log('🔗 Creating admin user...');
    
    const adminEmail = 'archplan.vivid@gmail.com';
    const adminPassword = 'Vividarch4321$$';
    const adminName = 'ArchPlan Admin';

    console.log('📧 Email:', adminEmail);
    console.log('👤 Name:', adminName);

    const result = await createAdmin(adminEmail, adminPassword, adminName);
    
    console.log('✅ Admin user created successfully!');
    console.log('🆔 Admin ID:', result.id);
    console.log('📧 Email:', result.email);
    console.log('👤 Name:', result.name);
    console.log('🌐 You can now login at: http://localhost:5000/admin/login');
    
  } catch (error) {
    if (error.message && error.message.includes('already registered')) {
      console.log('👤 Admin user already exists with this email');
      console.log('📧 Email:', 'archplan.vivid@gmail.com');
      console.log('🔑 Password:', 'Vividarch4321$$');
      console.log('🌐 You can login at: http://localhost:5000/admin/login');
    } else {
      console.error('❌ Error creating admin user:', error.message || error);
    }
  }
}

createAdminUser();