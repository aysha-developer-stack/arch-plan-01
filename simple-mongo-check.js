import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function checkMongoDB() {
  console.log('🔍 Simple MongoDB Check');
  console.log('======================\n');

  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.log('❌ MONGODB_URI not found in .env file');
    return;
  }

  console.log('📍 Connecting to MongoDB...');
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected successfully\n');
    
    // Get database name from URI (handle MongoDB Atlas format)
    let dbName = 'test';
    try {
      // Extract database name from MongoDB URI
      const match = uri.match(/\/([^?]+)\?/);
      if (match && match[1]) {
        dbName = match[1];
      }
    } catch (error) {
      console.log('   Using default database name: test');
    }
    console.log(`📊 Database: ${dbName}`);
    
    const db = client.db(dbName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Collections found:');
    if (collections.length === 0) {
      console.log('   ⚠️  No collections found');
      console.log('   This means no data has been saved yet');
    } else {
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`   - ${col.name}: ${count} documents`);
      }
    }
    
    // Specifically check for plans collection
    console.log('\n📋 Plans Collection Check:');
    const plansCollection = db.collection('plans');
    const planCount = await plansCollection.countDocuments();
    
    if (planCount === 0) {
      console.log('   ⚠️  No plans found');
      console.log('   Possible reasons:');
      console.log('   1. No uploads have been successful');
      console.log('   2. Uploads are failing silently');
      console.log('   3. Data is being saved elsewhere');
    } else {
      console.log(`   ✅ Found ${planCount} plans`);
      
      // Show recent plans
      const recentPlans = await plansCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray();
      
      console.log('\n📄 Recent uploads:');
      recentPlans.forEach((plan, i) => {
        console.log(`   ${i + 1}. ${plan.title || plan.fileName || 'Untitled'}`);
        console.log(`      Created: ${plan.createdAt || 'Unknown'}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await client.close();
  }

  console.log('\n📝 MongoDB Compass Instructions:');
  console.log('1. Open MongoDB Compass');
  console.log('2. Use this connection string:');
  console.log(`   ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  console.log('3. Look for database: "Archplan"');
  console.log('4. Look for collection: "plans"');
  console.log('5. If no "plans" collection, try uploading a file first');
  console.log('6. After upload, refresh Compass (F5)');
}

checkMongoDB().catch(console.error);
