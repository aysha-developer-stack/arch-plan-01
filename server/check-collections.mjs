import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config({ path: '../.env' });

// If MONGODB_URI is still undefined, try loading from project root
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: '../.env' });
  if (!process.env.MONGODB_URI) {
    dotenv.config();
  }
}

async function checkCollections() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log('🗄️  Database name:', dbName);

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Collections in database:');
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });

    // Check if admins collection exists and count documents
    if (collections.some(col => col.name === 'admins')) {
      const adminCount = await mongoose.connection.db.collection('admins').countDocuments();
      console.log(`👥 Admin documents count: ${adminCount}`);
      
      if (adminCount > 0) {
        const admins = await mongoose.connection.db.collection('admins').find({}).toArray();
        console.log('👤 Admin users:');
        admins.forEach((admin, index) => {
          console.log(`${index + 1}. Email: ${admin.email}, ID: ${admin._id}`);
        });
      }
    } else {
      console.log('❌ No admins collection found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkCollections();