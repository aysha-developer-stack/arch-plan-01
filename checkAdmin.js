import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Check admin user
async function checkAdminUser() {
  try {
    await connectDB();
    
    // Try to find the admin user
    const Admin = mongoose.models.Admin || mongoose.model('Admin', new mongoose.Schema({
      email: String,
      password: String,
      name: String,
      role: { type: String, default: 'admin' },
      createdAt: { type: Date, default: Date.now }
    }));
    
    const admin = await Admin.findOne({ email: 'archplan.vivid@gmail.com' });
    
    if (admin) {
      console.log('\n✅ Admin user found:');
      console.log('Email:', admin.email);
      console.log('Name:', admin.name);
      console.log('Role:', admin.role);
      console.log('Created At:', admin.createdAt);
      console.log('\n✅ Admin user is ready to use!');
    } else {
      console.log('\n❌ Admin user not found. Creating one...');
      
      // Create admin user if not exists
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash('Vividarch4321$$', 10);
      
      const newAdmin = new Admin({
        email: 'archplan.vivid@gmail.com',
        password: hashedPassword,
        name: 'ArchPlan Admin',
        role: 'admin'
      });
      
      await newAdmin.save();
      console.log('✅ Admin user created successfully!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the check
checkAdminUser();
