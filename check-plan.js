// Script to check if a specific plan exists in the database
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Plan schema (simplified)
const planSchema = new mongoose.Schema({}, { strict: false });
const Plan = mongoose.model('Plan', planSchema);

async function checkPlan() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const planId = '689771da18b4ed6949b139c0';
    console.log(`🔍 Looking for plan with ID: ${planId}`);
    
    const plan = await Plan.findById(planId);
    
    if (plan) {
      console.log('✅ Plan found:');
      console.log('- ID:', plan._id.toString());
      console.log('- Title:', plan.title);
      console.log('- FileName:', plan.fileName);
      console.log('- FilePath:', plan.filePath);
      console.log('- Has Content:', !!plan.content);
      console.log('- Content Length:', plan.content ? plan.content.length : 0);
      console.log('- Download Count:', plan.downloadCount || 0);
    } else {
      console.log('❌ Plan not found with ID:', planId);
      console.log('💡 This explains why the /api/plans/:id/view endpoint returns 404');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the check
checkPlan();
