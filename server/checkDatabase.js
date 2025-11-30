const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

async function checkDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables!');
      process.exit(1);
    }
    
    console.log(`🔗 Connecting to: ${mongoUri}`);
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Get database name from connection
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📂 Database name: ${dbName}`);
    
    // List all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Collections in database:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });
    
    // Check if admins collection exists
    const adminCollection = collections.find(col => col.name === 'admins');
    if (adminCollection) {
      console.log('\n👤 Admin collection found! Checking documents...');
      
      // Get all documents from admins collection
      const admins = await mongoose.connection.db.collection('admins').find({}).toArray();
      console.log(`📊 Number of admin documents: ${admins.length}`);
      
      if (admins.length > 0) {
        console.log('\n👥 Admin users:');
        admins.forEach((admin, index) => {
          console.log(`  ${index + 1}. Email: ${admin.email}`);
          console.log(`     ID: ${admin._id}`);
          console.log(`     Created: ${admin.createdAt}`);
          console.log(`     Password Hash: ${admin.password.substring(0, 20)}...`);
          console.log('');
        });
      }
    } else {
      console.log('\n❌ No "admins" collection found in database');
    }
    
    // Also check for any collections that might contain admin data
    console.log('\n🔍 Checking all collections for admin-related data...');
    for (const collection of collections) {
      try {
        const count = await mongoose.connection.db.collection(collection.name).countDocuments();
        console.log(`  ${collection.name}: ${count} documents`);
        
        // Check if this collection might contain admin data
        if (collection.name.toLowerCase().includes('admin') || collection.name.toLowerCase().includes('user')) {
          const sample = await mongoose.connection.db.collection(collection.name).findOne();
          if (sample) {
            console.log(`    Sample document keys: ${Object.keys(sample).join(', ')}`);
          }
        }
      } catch (error) {
        console.log(`    Error checking ${collection.name}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

checkDatabase();
