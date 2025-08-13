import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function checkMongoDBData() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env file');
    return;
  }

  console.log('🔍 Connecting to MongoDB...');
  console.log('📍 URI:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    // Get database name from URI or use default
    const dbName = new URL(uri).pathname.slice(1) || 'test';
    console.log('📊 Database name:', dbName);
    
    const db = client.db(dbName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Collections in database:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // Check Plans collection
    console.log('\n📋 Checking Plans collection:');
    const plansCollection = db.collection('plans');
    const planCount = await plansCollection.countDocuments();
    console.log(`  Total plans: ${planCount}`);
    
    if (planCount > 0) {
      console.log('\n📄 Recent plans:');
      const recentPlans = await plansCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
      
      recentPlans.forEach((plan, index) => {
        console.log(`  ${index + 1}. ${plan.title || plan.fileName || 'Untitled'}`);
        console.log(`     ID: ${plan._id}`);
        console.log(`     Created: ${plan.createdAt || 'N/A'}`);
        console.log(`     File: ${plan.fileName || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('  ⚠️  No plans found in database');
    }
    
    // Check Users collection
    console.log('👥 Checking Users collection:');
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log(`  Total users: ${userCount}`);
    
    console.log('\n✅ Database check complete!');
    console.log('\n📝 MongoDB Compass Instructions:');
    console.log('1. Open MongoDB Compass');
    console.log('2. Connect using the same URI from your .env file');
    console.log(`3. Navigate to database: "${dbName}"`);
    console.log('4. Look for collections: "plans" and "users"');
    console.log('5. Click on "plans" collection to see uploaded data');
    console.log('6. If you don\'t see data, try refreshing (F5) or reconnecting');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkMongoDBData().catch(console.error);
