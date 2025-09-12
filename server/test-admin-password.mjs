import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: '../.env' });

// Admin Schema
const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Password comparison method
AdminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', AdminSchema);

async function testAdminPassword() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the admin user
    const admin = await Admin.findOne({ email: 'archplan.vivid@gmail.com' });
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('👤 Found admin user:', admin.email);
    console.log('🔑 Stored password hash:', admin.password.substring(0, 20) + '...');

    // Test the password
    const testPassword = 'Vividarch4321$$';
    console.log('🧪 Testing password:', testPassword);
    
    const isMatch = await admin.comparePassword(testPassword);
    console.log('✅ Password match result:', isMatch);

    if (!isMatch) {
      console.log('❌ Password does not match!');
      console.log('💡 This could be why login is failing.');
    } else {
      console.log('✅ Password matches correctly!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testAdminPassword();