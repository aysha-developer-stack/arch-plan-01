// Migration script to fix existing files in MongoDB
// This adds a fallback for files that don't have content stored

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Plan schema (simplified)
const planSchema = new mongoose.Schema({
  title: String,
  fileName: String,
  filePath: String,
  content: String,
  // ... other fields
}, { timestamps: true });

const Plan = mongoose.model('Plan', planSchema);

async function fixExistingFiles() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all plans without content
    const plansWithoutContent = await Plan.find({
      $or: [
        { content: { $exists: false } },
        { content: null },
        { content: '' }
      ]
    });

    console.log(`📊 Found ${plansWithoutContent.length} plans without content`);

    for (const plan of plansWithoutContent) {
      console.log(`\n🔧 Processing plan: ${plan.title} (${plan._id})`);
      
      // Try to read the file if it exists locally
      const localFilePath = path.join(process.cwd(), plan.filePath);
      
      if (fs.existsSync(localFilePath)) {
        try {
          const fileBuffer = fs.readFileSync(localFilePath);
          const base64Content = fileBuffer.toString('base64');
          
          // Update the plan with content
          await Plan.findByIdAndUpdate(plan._id, {
            content: base64Content
          });
          
          console.log(`✅ Added content to plan: ${plan.title} (${base64Content.length} chars)`);
        } catch (fileError) {
          console.log(`❌ Could not read file for ${plan.title}:`, fileError.message);
        }
      } else {
        console.log(`⚠️  File not found locally for ${plan.title}: ${localFilePath}`);
        console.log(`   This plan will need to be re-uploaded through the admin panel`);
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log('📝 Plans without local files will need to be re-uploaded through the admin panel');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the migration
fixExistingFiles();
