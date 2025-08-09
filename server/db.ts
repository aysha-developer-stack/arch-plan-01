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

  try {
    // Connect to MongoDB without deprecated options
    // useNewUrlParser and useUnifiedTopology are no longer needed in MongoDB driver v4+
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
