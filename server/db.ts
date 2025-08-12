import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn("⚠️  MONGODB_URI not set. Application will use in-memory storage.");
    console.warn("⚠️  Data will not persist between restarts.");
    console.warn("⚠️  Set MONGODB_URI to use MongoDB database.");
    return null;
  }

  console.log('🔍 MongoDB Connection Debug Info:');
  console.log(`   URI exists: ${!!process.env.MONGODB_URI}`);
  console.log(`   URI length: ${process.env.MONGODB_URI.length}`);
  console.log(`   URI starts with: ${process.env.MONGODB_URI.substring(0, 20)}...`);
  console.log(`   Full URI (masked): ${process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

  try {
    console.log('🔌 Attempting MongoDB connection...');
    // Connect to MongoDB without deprecated options
    // useNewUrlParser and useUnifiedTopology are no longer needed in MongoDB driver v4+
    const conn = await mongoose.connect(process.env.MONGODB_URI!, {
      // Add connection timeout options to help diagnose issues
      serverSelectionTimeoutMS: 10000, // 10 seconds
      connectTimeoutMS: 10000, // 10 seconds
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Connection state: ${conn.connection.readyState}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error details:');
    console.error('   Error name:', (error as any)?.name);
    console.error('   Error message:', (error as any)?.message);
    if ((error as any)?.code) console.error('   Error code:', (error as any).code);
    if ((error as any)?.codeName) console.error('   Error codeName:', (error as any).codeName);
    console.warn("⚠️  Falling back to in-memory storage.");
    return null;
  }
};

export default connectDB;
