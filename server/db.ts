import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables

const connectDB = async (retries = 3) => {
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

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔌 Attempting MongoDB connection (attempt ${attempt}/${retries})...`);

      // Set mongoose connection options globally
      mongoose.set('bufferCommands', false);

      const conn = await mongoose.connect(process.env.MONGODB_URI!, {
        serverSelectionTimeoutMS: 60000, // 60 seconds
        connectTimeoutMS: 60000, // 60 seconds
        socketTimeoutMS: 90000, // 90 seconds
        maxPoolSize: 20, // Maintain up to 20 socket connections
        minPoolSize: 5, // Maintain a minimum of 5 socket connections
        maxIdleTimeMS: 60000, // Close connections after 60 seconds of inactivity
        heartbeatFrequencyMS: 5000, // Send heartbeat every 5 seconds
        bufferCommands: false // Disable buffering
      });

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📊 Connection state: ${conn.connection.readyState}`);
      console.log(`🗄️  Database name: ${conn.connection.name}`);

      // Add connection event listeners
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
      });

      return conn;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${attempt}/${retries} failed:`);
      console.error('   Error name:', (error as any)?.name);
      console.error('   Error message:', (error as any)?.message);
      if ((error as any)?.code) console.error('   Error code:', (error as any).code);
      if ((error as any)?.codeName) console.error('   Error codeName:', (error as any).codeName);

      if (attempt === retries) {
        console.error("❌ All MongoDB connection attempts failed.");
        console.warn("⚠️  Falling back to in-memory storage.");
        return null;
      }

      // Wait before retrying
      const delay = attempt * 2000; // 2s, 4s, 6s delays
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return null;
};

export default connectDB;
