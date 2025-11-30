import { Plan } from '../schema.js';
import { extractKeywordsFromDescription } from '../utils/keywordExtractor.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
/**
 * Migration script to extract keywords from existing plan descriptions
 * This script will:
 * 1. Find all plans that don't have extractedKeywords or have empty extractedKeywords
 * 2. Extract keywords from their descriptions
 * 3. Update the plans with the extracted keywords
 */
async function migrateKeywords() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/archplan';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
        // Find plans that need keyword extraction
        const plansToMigrate = await Plan.find({
            $or: [
                { extractedKeywords: { $exists: false } },
                { extractedKeywords: { $size: 0 } },
                { extractedKeywords: null }
            ],
            description: { $exists: true, $ne: '' }
        });
        console.log(`🔍 Found ${plansToMigrate.length} plans that need keyword extraction`);
        if (plansToMigrate.length === 0) {
            console.log('✅ No plans need keyword migration');
            return;
        }
        let successCount = 0;
        let errorCount = 0;
        // Process each plan
        for (const plan of plansToMigrate) {
            try {
                if (!plan.description) {
                    console.log(`⚠️  Skipping plan ${plan._id} - no description`);
                    continue;
                }
                // Extract keywords from description
                const keywordResult = extractKeywordsFromDescription(plan.description);
                const extractedKeywords = keywordResult.keywords;
                // Update the plan with extracted keywords
                await Plan.findByIdAndUpdate(plan._id, {
                    extractedKeywords,
                    updatedAt: new Date()
                });
                console.log(`✅ Updated plan ${plan._id} (${plan.title}) with ${extractedKeywords.length} keywords: ${extractedKeywords.join(', ')}`);
                successCount++;
            }
            catch (error) {
                console.error(`❌ Error processing plan ${plan._id}:`, error);
                errorCount++;
            }
        }
        console.log('\n📊 Migration Summary:');
        console.log(`✅ Successfully migrated: ${successCount} plans`);
        console.log(`❌ Errors: ${errorCount} plans`);
        console.log(`📝 Total processed: ${successCount + errorCount} plans`);
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
    finally {
        // Close MongoDB connection
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}
/**
 * Dry run function to preview what the migration would do without making changes
 */
async function dryRunMigration() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/archplan';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB (DRY RUN MODE)');
        // Find plans that need keyword extraction
        const plansToMigrate = await Plan.find({
            $or: [
                { extractedKeywords: { $exists: false } },
                { extractedKeywords: { $size: 0 } },
                { extractedKeywords: null }
            ],
            description: { $exists: true, $ne: '' }
        });
        console.log(`🔍 DRY RUN: Found ${plansToMigrate.length} plans that would be migrated`);
        // Show preview of first 5 plans
        const previewPlans = plansToMigrate.slice(0, 5);
        console.log('\n📋 Preview of plans to be migrated:');
        for (const plan of previewPlans) {
            if (plan.description) {
                const keywordResult = extractKeywordsFromDescription(plan.description);
                console.log(`\n📄 Plan: ${plan.title} (${plan._id})`);
                console.log(`📝 Description: ${plan.description.substring(0, 100)}...`);
                console.log(`🏷️  Would extract keywords: ${keywordResult.keywords.join(', ')}`);
            }
        }
        if (plansToMigrate.length > 5) {
            console.log(`\n... and ${plansToMigrate.length - 5} more plans`);
        }
    }
    catch (error) {
        console.error('❌ Dry run failed:', error);
        process.exit(1);
    }
    finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}
// Check command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-d');
if (isDryRun) {
    console.log('🔍 Running in DRY RUN mode - no changes will be made');
    dryRunMigration();
}
else {
    console.log('🚀 Starting keyword migration...');
    migrateKeywords();
}
//# sourceMappingURL=migrateKeywords.js.map