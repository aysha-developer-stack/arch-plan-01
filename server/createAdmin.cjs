const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Admin Schema (inline since we can't import TypeScript files)
const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
AdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password comparison method
AdminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', AdminSchema);

async function createAdmin() {
  try {
    // Get MongoDB URI from environment variables
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables!');
      console.log('Please make sure you have a .env file with MONGODB_URI set.');
      process.exit(1);
    }
    
    console.log(`🔗 Connecting to: ${mongoUri}`);
    
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
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
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: archplan.vivid@gmail.com');
    console.log('🔑 Password: Vividarch4321$$');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

createAdmin();
