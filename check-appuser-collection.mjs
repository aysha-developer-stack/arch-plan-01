import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkAppUserCollection() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables!');
      return;
    }
    
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check if appusers collection exists
    const collections = await db.listCollections().toArray();
    const appUsersCollection = collections.find(col => col.name === 'appusers');
    
    console.log('\n📋 Collections in database:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    if (appUsersCollection) {
      console.log('\n✅ AppUsers collection found!');
      
      // Check indexes on appusers collection
      const indexes = await db.collection('appusers').indexes();
      console.log('\n🔍 Indexes on appusers collection:');
      indexes.forEach((index, i) => {
        console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
      });
      
      // Count documents
      const count = await db.collection('appusers').countDocuments();
      console.log(`\n📊 Total AppUser documents: ${count}`);
      
      if (count > 0) {
        console.log('\n👥 Sample AppUser documents:');
        const users = await db.collection('appusers').find({}, { password: 0 }).limit(3).toArray();
        users.forEach((user, index) => {
          console.log(`  ${index + 1}. Email: ${user.email}`);
          console.log(`     Status: ${user.status}`);
          console.log(`     Created: ${user.createdAt}`);
        });
      }
    } else {
      console.log('\n❌ AppUsers collection not found!');
      console.log('This means no users have been created yet.');
      
      // Create the collection with proper indexes
      console.log('\n🔧 Creating AppUsers collection with indexes...');
      const appUsersCol = db.collection('appusers');
      
      // Create unique index on email
      await appUsersCol.createIndex({ email: 1 }, { unique: true });
      console.log('✅ Created unique index on email field');
      
      // Create index on status
      await appUsersCol.createIndex({ status: 1 });
      console.log('✅ Created index on status field');
      
      console.log('\n🎉 AppUsers collection is now ready for use!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.log('This is a duplicate key error - indexes already exist.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAppUserCollection();