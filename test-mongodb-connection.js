import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './shared/schema.js';

dotenv.config();

async function testConnection() {
  console.log('🧪 Testing MongoDB Connection...');
  
  try {
    // Test connection
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    
    console.log('✅ Connected successfully');
    console.log('📊 Connection state:', mongoose.connection.readyState);
    console.log('🗄️ Database name:', mongoose.connection.name);
    
    // Test User model
    console.log('👤 Testing User model...');
    const userCount = await User.countDocuments();
    console.log('📈 Current user count:', userCount);
    
    // Test creating a user
    console.log('🆕 Testing user creation...');
    const testUser = new User({
      id: 'test-' + Date.now(),
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'testpassword',
      status: 'pending'
    });
    
    const savedUser = await testUser.save();
    console.log('✅ User created successfully:', savedUser.email);
    
    // Clean up test user
    await User.deleteOne({ _id: savedUser._id });
    console.log('🧹 Test user cleaned up');
    
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    process.exit(0);
  }
}

testConnection();
