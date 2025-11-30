import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

console.log('🔍 MongoDB Compass Connection Troubleshooting');
console.log('==============================================');

async function checkMongoDBDetails() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('\n📋 Connection Details for MongoDB Compass:');
    console.log('==========================================');
    console.log(`🔗 Connection String: ${process.env.MONGODB_URI}`);
    console.log(`🏠 Host: ${conn.connection.host}`);
    console.log(`🗄️  Database Name: "${conn.connection.name}"`);
    console.log(`📊 Connection State: ${conn.connection.readyState}`);
    
    // Get all databases
    console.log('\n📚 Available Databases:');
    const admin = conn.connection.db.admin();
    const databases = await admin.listDatabases();
    databases.databases.forEach((db, index) => {
      console.log(`   ${index + 1}. "${db.name}" (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Check current database collections
    console.log(`\n📁 Collections in "${conn.connection.name}" database:`);
    const collections = await conn.connection.db.listCollections().toArray();
    for (const collection of collections) {
      const count = await conn.connection.db.collection(collection.name).countDocuments();
      console.log(`   📄 ${collection.name}: ${count} documents`);
    }
    
    // Get detailed plan information
    console.log('\n📋 Detailed Plan Information:');
    const plansCollection = conn.connection.db.collection('plans');
    const plans = await plansCollection.find({}).toArray();
    
    plans.forEach((plan, index) => {
      console.log(`\n   Plan ${index + 1}:`);
      console.log(`     📝 ID: ${plan._id}`);
      console.log(`     📋 Title: "${plan.title}"`);
      console.log(`     🏠 Type: ${plan.planType}`);
      console.log(`     📅 Created: ${plan.createdAt}`);
      console.log(`     📁 File: ${plan.fileName}`);
      console.log(`     📍 Status: ${plan.status}`);
    });
    
    console.log('\n🎯 MongoDB Compass Instructions:');
    console.log('================================');
    console.log('1. Open MongoDB Compass');
    console.log('2. Use this EXACT connection string:');
    console.log(`   ${process.env.MONGODB_URI}`);
    console.log('3. After connecting, look for:');
    console.log(`   📁 Database: "${conn.connection.name}"`);
    console.log('   📄 Collection: "plans"');
    console.log(`   📊 Documents: ${plans.length} plan(s)`);
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkMongoDBDetails();
