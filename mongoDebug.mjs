import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function debugMongoConnection() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    console.log('🔍 MongoDB Connection Debug');
    console.log('============================');
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables!');
      return;
    }
    
    // Parse the URI to show details (without exposing password)
    const uriParts = mongoUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+)/);
    if (uriParts) {
      console.log(`📋 Connection Details:`);
      console.log(`   Username: ${uriParts[1]}`);
      console.log(`   Password: ${'*'.repeat(uriParts[2].length)} (${uriParts[2].length} chars)`);
      console.log(`   Cluster: ${uriParts[3]}`);
      console.log(`   Database: ${uriParts[4]}`);
    }
    
    console.log('\n🔗 Attempting connection...');
    
    // Try to connect with detailed error handling
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test database access
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`\n📊 Database Info:`);
    console.log(`   Database Name: ${db.databaseName}`);
    console.log(`   Collections Found: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log('   Collection Names:');
      collections.forEach(col => console.log(`     - ${col.name}`));
    }
    
    // Try to access Admin collection specifically
    const adminCollection = db.collection('admins');
    const adminCount = await adminCollection.countDocuments();
    console.log(`\n👤 Admin Collection:`);
    console.log(`   Admin documents: ${adminCount}`);
    
    if (adminCount > 0) {
      const admins = await adminCollection.find({}, { password: 0 }).toArray();
      console.log('   Admin users:');
      admins.forEach((admin, index) => {
        console.log(`     ${index + 1}. Email: ${admin.email}`);
        console.log(`        ID: ${admin._id}`);
        console.log(`        Created: ${admin.createdAt || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error(`   Error Type: ${error.constructor.name}`);
    console.error(`   Error Code: ${error.code || 'N/A'}`);
    console.error(`   Error Message: ${error.message}`);
    
    if (error.code === 18) {
      console.log('\n🔧 Authentication Failed - Possible Solutions:');
      console.log('   1. Verify username and password in MongoDB Atlas');
      console.log('   2. Check Database Access permissions for the user');
      console.log('   3. Ensure the user has access to the specified database');
      console.log('   4. Try connecting without specifying a database first');
    }
    
    if (error.code === 8000) {
      console.log('\n🔧 Network/SSL Error - Possible Solutions:');
      console.log('   1. Check your internet connection');
      console.log('   2. Verify the cluster URL is correct');
      console.log('   3. Check if your IP is whitelisted in MongoDB Atlas');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugMongoConnection();
