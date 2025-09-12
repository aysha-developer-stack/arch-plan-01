import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

const deleteReplitCollection = async () => {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 MongoDB URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    
    // Check if replit_users collection exists
    const collections = await db.listCollections({ name: 'replit_users' }).toArray();
    
    if (collections.length === 0) {
      console.log('✅ replit_users collection does not exist.');
      return;
    }
    
    console.log('🔍 Found replit_users collection');
    
    const replitUsersCollection = db.collection('replit_users');
    const count = await replitUsersCollection.countDocuments();
    
    console.log(`📊 replit_users collection contains ${count} documents`);
    
    if (count > 0) {
      console.log('⚠️  Collection contains data. Showing sample documents:');
      const samples = await replitUsersCollection.find({}).limit(3).toArray();
      samples.forEach((doc, index) => {
        console.log(`  Document ${index + 1}:`, JSON.stringify(doc, null, 2));
      });
    }
    
    // Delete the collection
    console.log('🗑️  Deleting replit_users collection...');
    await replitUsersCollection.drop();
    console.log('✅ Successfully deleted replit_users collection');
    
    // Verify deletion
    const remainingCollections = await db.listCollections().toArray();
    console.log('📋 Remaining collections:', remainingCollections.map(c => c.name));
    
  } catch (error) {
    if (error.message.includes('ns not found')) {
      console.log('✅ replit_users collection was already deleted or does not exist.');
    } else {
      console.error('🚨 Error:', error.message);
    }
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
};

deleteReplitCollection();