import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: '../.env' });
// Also try loading from project root if the above fails
if (!process.env.MONGODB_URI) {
  dotenv.config();
}

// Admin Schema
const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
AdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password comparison method
AdminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', AdminSchema);

async function createAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'archplan.vivid@gmail.com' });
    if (existingAdmin) {
      console.log('👤 Admin user already exists with email: archplan.vivid@gmail.com');
      return;
    }

    // Create new admin user
    const admin = new Admin({
      email: 'archplan.vivid@gmail.com',
      password: 'Vividarch4321$$'
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: archplan.vivid@gmail.com');
    console.log('🔑 Password: Vividarch4321$$');
    console.log('🆔 Admin ID:', admin._id);

    // Verify the admin was created
    const verifyAdmin = await Admin.findOne({ email: 'archplan.vivid@gmail.com' });
    if (verifyAdmin) {
      console.log('✅ Verification: Admin user found in database');
      
      // Test password comparison
      const isMatch = await verifyAdmin.comparePassword('Vividarch4321$$');
      console.log('🧪 Password verification test:', isMatch ? '✅ PASS' : '❌ FAIL');
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createAdmin();