import mongoose from 'mongoose';

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn("⚠️  MONGODB_URI not set. Application will use in-memory storage.");
    console.warn("⚠️  Data will not persist between restarts.");
    console.warn("⚠️  Set MONGODB_URI to use MongoDB database.");
    return null;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI!);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.warn("⚠️  Falling back to in-memory storage.");
    return null;
  }
};

export default connectDB;