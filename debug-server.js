const mongoose = require('mongoose');
require('dotenv').config();

async function debugConnection() {
  console.log('🔍 Debugging MongoDB Connection...');
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found');
    return;
  }
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Disable buffering
    mongoose.set('bufferCommands', false);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    
    console.log('✅ Connected successfully');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Database name:', mongoose.connection.name);
    
    // Test basic operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Test User model
    const { User } = require('./shared/schema');
    console.log('User model loaded:', !!User);
    
    const userCount = await User.countDocuments();
    console.log('User count:', userCount);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

debugConnection();
