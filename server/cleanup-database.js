// Database cleanup utility to optimize storage by removing duplicate base64 content
// when files exist on filesystem

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
  fileSize: Number,
  content: String, // Base64 encoded file content
  downloadCount: { type: Number, default: 0 },
  // ... other fields
}, { timestamps: true });

const Plan = mongoose.model('Plan', planSchema);

async function cleanupDuplicateStorage() {
  try {
    console.log('🧹 Starting database cleanup to optimize storage...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const plans = await Plan.find({ content: { $exists: true, $ne: null } });
    console.log(`📊 Found ${plans.length} plans with database content`);
    
    let cleanedCount = 0;
    let keptCount = 0;
    let totalSpaceSaved = 0;
    
    for (const plan of plans) {
      const originalPath = plan.filePath;
      let fileExists = false;
      let resolvedPath = '';
      
      // Check if file exists using same logic as download endpoint
      const searchPaths = [
        path.isAbsolute(originalPath) ? originalPath : path.join(process.cwd(), originalPath),
        path.join(process.cwd(), '..', originalPath),
        path.join(process.cwd(), 'uploads', path.basename(originalPath)),
        path.join(process.cwd(), '..', 'uploads', path.basename(originalPath))
      ];
      
      for (const searchPath of searchPaths) {
        if (fs.existsSync(searchPath)) {
          fileExists = true;
          resolvedPath = searchPath;
          break;
        }
      }
      
      if (fileExists) {
        // File exists on filesystem, remove database content to save space
        const contentSize = plan.content.length;
        await Plan.updateOne(
          { _id: plan._id },
          { $unset: { content: 1 } }
        );
        
        cleanedCount++;
        totalSpaceSaved += contentSize;
        console.log(`🗑️  Removed database content for: ${plan.title} (${Math.round(contentSize/1024)}KB saved)`);
      } else {
        // File doesn't exist, keep database content as fallback
        keptCount++;
        console.log(`💾 Kept database content for: ${plan.title} (file not found)`);
      }
    }
    
    console.log('\n📈 Cleanup Summary:');
    console.log(`   - Plans cleaned: ${cleanedCount}`);
    console.log(`   - Plans kept (no file): ${keptCount}`);
    console.log(`   - Total space saved: ${Math.round(totalSpaceSaved/1024/1024)}MB`);
    console.log(`   - Storage optimization: ${Math.round((cleanedCount/(cleanedCount+keptCount))*100)}%`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Add command line argument to actually perform cleanup
const shouldCleanup = process.argv.includes('--execute');

if (shouldCleanup) {
  cleanupDuplicateStorage();
} else {
  console.log('🔍 Database Cleanup Utility');
  console.log('This script will remove duplicate base64 content from database');
  console.log('when files exist on the filesystem to optimize storage.');
  console.log('');
  console.log('To perform the cleanup, run:');
  console.log('node cleanup-database.js --execute');
  console.log('');
  console.log('⚠️  Make sure to backup your database before running!');
}