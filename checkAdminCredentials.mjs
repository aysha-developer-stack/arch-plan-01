import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Admin Schema
const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', AdminSchema);

async function checkAdminCredentials() {
  try {
    // Get MongoDB URI from environment variables
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables!');
      process.exit(1);
    }
    
    console.log('🔗 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check for admin users
    const admins = await Admin.find({});
    
    if (admins.length === 0) {
      console.log('❌ No admin users found in database!');
      console.log('You need to create an admin user first.');
    } else {
      console.log(`✅ Found ${admins.length} admin user(s):`);
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. Email: ${admin.email}`);
        console.log(`   Created: ${admin.createdAt}`);
        console.log(`   ID: ${admin._id}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking admin credentials:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

checkAdminCredentials();
