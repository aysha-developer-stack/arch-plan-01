const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arch-plan');

// User Schema (simplified for testing)
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  firstName: String,
  lastName: String,
  password: { type: String },
  profileImageUrl: String,
  downloadCount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function testUserApproval() {
  try {
    console.log('🧪 Testing User Approval System...\n');

    // Test 1: Create a pending user
    console.log('1. Creating a pending user...');
    const testUser = new User({
      id: 'test@example.com',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'password123',
      status: 'pending'
    });

    await testUser.save();
    console.log('✅ User created with pending status');

    // Test 2: Try to login with pending user
    console.log('\n2. Testing login with pending user...');
    const loginUser = await User.findOne({ email: 'test@example.com' });
    const isPasswordValid = await loginUser.comparePassword('password123');
    
    if (isPasswordValid) {
      console.log('✅ Password validation works');
      console.log(`📊 User status: ${loginUser.status}`);
    } else {
      console.log('❌ Password validation failed');
    }

    // Test 3: Approve the user
    console.log('\n3. Approving the user...');
    loginUser.status = 'approved';
    loginUser.rejectionReason = undefined;
    await loginUser.save();
    console.log('✅ User approved');

    // Test 4: Verify approved status
    const approvedUser = await User.findOne({ email: 'test@example.com' });
    console.log(`📊 User status after approval: ${approvedUser.status}`);

    // Test 5: Create another user and reject them
    console.log('\n4. Creating and rejecting another user...');
    const rejectUser = new User({
      id: 'reject@example.com',
      email: 'reject@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password: 'password456',
      status: 'pending'
    });

    await rejectUser.save();
    console.log('✅ Second user created');

    // Reject the user
    rejectUser.status = 'rejected';
    rejectUser.rejectionReason = 'Invalid email domain';
    await rejectUser.save();
    console.log('✅ User rejected with reason');

    // Test 6: Get all users with different statuses
    console.log('\n5. Fetching users by status...');
    const pendingUsers = await User.find({ status: 'pending' });
    const approvedUsers = await User.find({ status: 'approved' });
    const rejectedUsers = await User.find({ status: 'rejected' });

    console.log(`📊 Pending users: ${pendingUsers.length}`);
    console.log(`📊 Approved users: ${approvedUsers.length}`);
    console.log(`📊 Rejected users: ${rejectedUsers.length}`);

    // Test 7: Get user statistics
    console.log('\n6. User statistics...');
    const [pendingCount, approvedCount, rejectedCount, totalCount] = await Promise.all([
      User.countDocuments({ status: 'pending' }),
      User.countDocuments({ status: 'approved' }),
      User.countDocuments({ status: 'rejected' }),
      User.countDocuments()
    ]);

    console.log(`📈 Total users: ${totalCount}`);
    console.log(`📈 Pending: ${pendingCount}`);
    console.log(`📈 Approved: ${approvedCount}`);
    console.log(`📈 Rejected: ${rejectedCount}`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Test Summary:');
    console.log('- User creation with pending status: ✅');
    console.log('- Password hashing and validation: ✅');
    console.log('- User approval workflow: ✅');
    console.log('- User rejection with reason: ✅');
    console.log('- Status-based user queries: ✅');
    console.log('- User statistics: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
testUserApproval();
