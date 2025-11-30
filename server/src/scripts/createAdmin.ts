import mongoose from 'mongoose';
import Admin from '../models/Admin';
import config from '../config';

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'archplan.vivid@gmail.com' });
    if (existingAdmin) {
      console.log('Admin user already exists with email: archplan.vivid@gmail.com');
      process.exit(0);
    }

    // Create new admin user
    const admin = new Admin({
      email: 'archplan.vivid@gmail.com',
      password: 'Vividarch4321$$'
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: archplan.vivid@gmail.com');
    console.log('Password: Vividarch4321$$');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

createAdmin();
