import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

console.log('🔍 MongoDB Storage Debug');
console.log('========================');

// Check environment variables
console.log('Environment Variables:');
console.log(`  MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);
console.log(`  MONGODB_URI length: ${process.env.MONGODB_URI?.length || 0}`);
console.log(`  PORT: ${process.env.PORT || 'not set'}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

if (!process.env.MONGODB_URI) {
  console.log('❌ MONGODB_URI is not set!');
  console.log('   This means the application will use in-memory storage.');
  console.log('   Data will not persist in MongoDB.');
  process.exit(1);
}

// Test MongoDB connection
console.log('\n🔌 Testing MongoDB Connection...');
try {
  const conn = await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB Connection Successful!');
  console.log(`   Host: ${conn.connection.host}`);
  console.log(`   Database: ${conn.connection.name}`);
  console.log(`   Ready State: ${conn.connection.readyState}`);
  
  // List collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`   Collections: ${collections.map(c => c.name).join(', ')}`);
  
  // Check if plans collection exists and has data
  const plansCollection = mongoose.connection.db.collection('plans');
  const planCount = await plansCollection.countDocuments();
  console.log(`   Plans in database: ${planCount}`);
  
  if (planCount > 0) {
    console.log('\n📄 Sample plans in database:');
    const samplePlans = await plansCollection.find({}).limit(3).toArray();
    samplePlans.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.title} (${plan.planType})`);
    });
  }
  
  await mongoose.connection.close();
  console.log('\n✅ MongoDB connection test completed successfully!');
  
} catch (error) {
  console.log('❌ MongoDB Connection Failed!');
  console.log(`   Error: ${error.message}`);
  console.log('   This means the application will use in-memory storage.');
  console.log('   Uploaded data will not appear in MongoDB Compass.');
}
