import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Plan } from './shared/schema.js';

dotenv.config();

async function debugMongoDB() {
  console.log('🔍 MongoDB Upload Debug Tool');
  console.log('================================\n');

  // Check environment variables
  console.log('1. Environment Check:');
  console.log(`   MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  
  if (!process.env.MONGODB_URI) {
    console.log('❌ MONGODB_URI not found in .env file');
    return;
  }

  // Extract database name from URI
  const dbName = new URL(process.env.MONGODB_URI).pathname.slice(1) || 'test';
  console.log(`   Database name: ${dbName}\n`);

  try {
    // Connect to MongoDB
    console.log('2. MongoDB Connection:');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✅ Connected successfully\n');

    // Check if plans collection exists and count documents
    console.log('3. Plans Collection Check:');
    const planCount = await Plan.countDocuments();
    console.log(`   Total plans in database: ${planCount}`);

    if (planCount > 0) {
      console.log('\n4. Recent Plans:');
      const recentPlans = await Plan.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title fileName createdAt uploadedBy status');
      
      recentPlans.forEach((plan, index) => {
        console.log(`   ${index + 1}. ${plan.title || plan.fileName || 'Untitled'}`);
        console.log(`      ID: ${plan._id}`);
        console.log(`      Created: ${plan.createdAt}`);
        console.log(`      Status: ${plan.status || 'N/A'}`);
        console.log(`      Uploaded by: ${plan.uploadedBy || 'N/A'}\n`);
      });
    } else {
      console.log('   ⚠️  No plans found in database');
      console.log('   This means either:');
      console.log('   - No uploads have been successful yet');
      console.log('   - Uploads are failing silently');
      console.log('   - Data is being saved to a different database/collection\n');
    }

    // Test creating a sample plan
    console.log('5. Test Plan Creation:');
    try {
      const testPlan = new Plan({
        title: 'Debug Test Plan',
        description: 'Test plan created by debug script',
        planType: 'Residential',
        storeys: 1,
        lotSize: 'Medium',
        orientation: 'North',
        siteType: 'Flat',
        foundationType: 'Slab',
        councilArea: 'Test Council',
        fileName: 'debug-test.pdf',
        filePath: 'uploads/debug-test.pdf',
        fileSize: 1024,
        uploadedBy: 'debug-script',
        status: 'active'
      });

      const savedPlan = await testPlan.save();
      console.log('   ✅ Test plan created successfully');
      console.log(`   Test plan ID: ${savedPlan._id}`);
      
      // Clean up test plan
      await Plan.findByIdAndDelete(savedPlan._id);
      console.log('   🧹 Test plan cleaned up\n');
      
    } catch (error) {
      console.log('   ❌ Failed to create test plan:');
      console.log(`   Error: ${error.message}\n`);
    }

    // Check database collections
    console.log('6. Database Collections:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('   Available collections:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });

  } catch (error) {
    console.log('❌ MongoDB Error:');
    console.log(`   ${error.message}`);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }

  console.log('\n📋 MongoDB Compass Instructions:');
  console.log('1. Open MongoDB Compass');
  console.log('2. Connect using your MONGODB_URI from .env');
  console.log(`3. Navigate to database: "${dbName}"`);
  console.log('4. Look for collection: "plans"');
  console.log('5. If no "plans" collection exists, no uploads have succeeded yet');
  console.log('6. Try uploading a file, then refresh Compass (F5)');
}

debugMongoDB().catch(console.error);
