import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

const removeReplitUsers = async () => {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 MongoDB URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    
    // List all collections first
    console.log('\n📋 Listing all collections...');
    const collections = await db.listCollections().toArray();
    console.log('Collections found:', collections.map(c => c.name));
    
    // Look for replit-related collections
    const replitCollections = collections.filter(c => 
      c.name.toLowerCase().includes('replit') || 
      c.name.toLowerCase().includes('user')
    );
    
    if (replitCollections.length === 0) {
      console.log('\n✅ No replit or user collections found.');
      return;
    }
    
    console.log('\n🔍 Found potential replit/user collections:', replitCollections.map(c => c.name));
    
    // Check each collection for replit-related data
    for (const collection of replitCollections) {
      const collectionName = collection.name;
      console.log(`\n📊 Checking collection: ${collectionName}`);
      
      const coll = db.collection(collectionName);
      const count = await coll.countDocuments();
      console.log(`📈 Document count: ${count}`);
      
      if (count > 0) {
        // Sample a few documents to see the structure
        const samples = await coll.find({}).limit(3).toArray();
        console.log('📄 Sample documents:');
        samples.forEach((doc, index) => {
          console.log(`  ${index + 1}:`, JSON.stringify(doc, null, 2).substring(0, 200) + '...');
        });
        
        // Ask for confirmation before deletion
        console.log(`\n⚠️  About to delete collection: ${collectionName}`);
        console.log(`📊 This will remove ${count} documents.`);
        
        // For safety, let's just log what we would delete instead of actually deleting
        console.log(`🗑️  Would delete collection: ${collectionName} (${count} documents)`);
        
        // Uncomment the line below to actually delete the collection
        // await coll.drop();
        // console.log(`✅ Deleted collection: ${collectionName}`);
      }
    }
    
    console.log('\n✅ Replit user collection removal check completed.');
    
  } catch (error) {
    console.error('🚨 Error:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
};

removeReplitUsers();