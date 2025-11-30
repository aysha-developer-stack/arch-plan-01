import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import mongoose from 'mongoose';
// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });
// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set in environment variables.');
    process.exit(1);
}
// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase URL or Anon Key not set in environment variables.');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// MongoDB schemas
const userSchema = new mongoose.Schema({
    email: String,
    firstName: String,
    lastName: String,
    profileImageUrl: String,
    downloadCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
const appUserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: String,
    approvedAt: Date,
    approvedBy: mongoose.Schema.Types.ObjectId,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
const planSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileId: String,
    content: String,
    images: [{
            path: String,
            filename: String,
            size: Number,
            fileId: String
        }],
    planType: { type: String, required: true },
    storeys: { type: Number, required: true },
    lotSize: String,
    orientation: String,
    siteType: String,
    foundationType: String,
    councilArea: String,
    plotLength: Number,
    plotWidth: Number,
    coveredArea: Number,
    roadPosition: String,
    builderName: String,
    jobAddress: String,
    houseType: String,
    bedrooms: { type: Number, default: 3 },
    toilets: { type: Number, default: 2 },
    livingAreas: { type: Number, default: 1 },
    numberOfUnits: Number,
    constructionType: [String],
    lotSizeMin: Number,
    lotSizeMax: Number,
    totalBuildingHeight: Number,
    roofPitch: Number,
    outdoorFeatures: [String],
    indoorFeatures: [String],
    extractedKeywords: [String],
    status: { type: String, default: 'active' },
    downloadCount: { type: Number, default: 0 },
    uploadedBy: mongoose.Schema.Types.ObjectId,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
// Define models
const User = mongoose.model('User', userSchema);
const AppUser = mongoose.model('AppUser', appUserSchema);
const Plan = mongoose.model('Plan', planSchema);
// Migration functions
async function migrateUsers() {
    console.log('🔄 Migrating users...');
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate.`);
    for (const user of users) {
        try {
            // Create user in Supabase
            const { data, error } = await supabase
                .from('users')
                .upsert({
                id: user._id.toString(),
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profileImageUrl: user.profileImageUrl,
                downloadCount: user.downloadCount,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            });
            if (error) {
                console.error(`❌ Error migrating user ${user._id}:`, error);
            }
            else {
                console.log(`✅ Migrated user ${user._id}`);
            }
        }
        catch (error) {
            console.error(`❌ Error migrating user ${user._id}:`, error);
        }
    }
}
async function migrateAppUsers() {
    console.log('🔄 Migrating app users...');
    const appUsers = await AppUser.find({});
    console.log(`Found ${appUsers.length} app users to migrate.`);
    for (const appUser of appUsers) {
        try {
            // Create user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: appUser.email,
                password: appUser.password,
                email_confirm: true,
                user_metadata: {
                    name: appUser.name
                }
            });
            if (authError) {
                console.error(`❌ Error creating auth user ${appUser._id}:`, authError);
                continue;
            }
            // Create user profile in Supabase
            const { data, error } = await supabase
                .from('app_users')
                .upsert({
                id: authData.user.id,
                email: appUser.email,
                name: appUser.name,
                status: appUser.status,
                rejection_reason: appUser.rejectionReason,
                created_at: appUser.createdAt,
                updated_at: appUser.updatedAt
            });
            if (error) {
                console.error(`❌ Error migrating app user ${appUser._id}:`, error);
            }
            else {
                console.log(`✅ Migrated app user ${appUser._id}`);
            }
        }
        catch (error) {
            console.error(`❌ Error migrating app user ${appUser._id}:`, error);
        }
    }
}
async function migratePlans() {
    console.log('🔄 Migrating plans...');
    const plans = await Plan.find({});
    console.log(`Found ${plans.length} plans to migrate.`);
    // Create a bucket for plans if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketName = 'plans';
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(bucketName, {
            public: false,
            fileSizeLimit: 100 * 1024 * 1024, // 100MB
        });
        if (error) {
            console.error('❌ Error creating bucket:', error);
            return;
        }
        else {
            console.log(`✅ Bucket '${bucketName}' created successfully`);
        }
    }
    for (const plan of plans) {
        try {
            let fileUrl = null;
            // Upload file to Supabase Storage if content exists
            if (plan.content) {
                const buffer = Buffer.from(plan.content, 'base64');
                const timestamp = Date.now();
                const filePath = `${timestamp}-${plan.fileName}`;
                const { error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, buffer, {
                    contentType: getContentType(plan.fileName),
                    upsert: false
                });
                if (uploadError) {
                    console.error(`❌ Error uploading file for plan ${plan._id}:`, uploadError);
                }
                else {
                    fileUrl = filePath;
                    console.log(`✅ Uploaded file for plan ${plan._id}`);
                }
            }
            // Create plan in Supabase
            const { data, error } = await supabase
                .from('plans')
                .upsert({
                id: plan._id.toString(),
                title: plan.title,
                description: plan.description,
                fileName: plan.fileName,
                filePath: plan.filePath,
                fileSize: plan.fileSize,
                file_url: fileUrl,
                planType: plan.planType,
                storeys: plan.storeys,
                lotSize: plan.lotSize,
                orientation: plan.orientation,
                siteType: plan.siteType,
                foundationType: plan.foundationType,
                councilArea: plan.councilArea,
                plotLength: plan.plotLength,
                plotWidth: plan.plotWidth,
                coveredArea: plan.coveredArea,
                roadPosition: plan.roadPosition,
                builderName: plan.builderName,
                jobAddress: plan.jobAddress,
                houseType: plan.houseType,
                bedrooms: plan.bedrooms,
                toilets: plan.toilets,
                livingAreas: plan.livingAreas,
                numberOfUnits: plan.numberOfUnits,
                constructionType: plan.constructionType,
                lotSizeMin: plan.lotSizeMin,
                lotSizeMax: plan.lotSizeMax,
                totalBuildingHeight: plan.totalBuildingHeight,
                roofPitch: plan.roofPitch,
                outdoorFeatures: plan.outdoorFeatures,
                indoorFeatures: plan.indoorFeatures,
                extractedKeywords: plan.extractedKeywords,
                status: plan.status,
                downloadCount: plan.downloadCount,
                uploadedBy: plan.uploadedBy?.toString(),
                created_at: plan.createdAt,
                updated_at: plan.updatedAt
            });
            if (error) {
                console.error(`❌ Error migrating plan ${plan._id}:`, error);
            }
            else {
                console.log(`✅ Migrated plan ${plan._id}`);
            }
        }
        catch (error) {
            console.error(`❌ Error migrating plan ${plan._id}:`, error);
        }
    }
}
function getContentType(fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'pdf':
            return 'application/pdf';
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        default:
            return 'application/octet-stream';
    }
}
// Main migration function
async function migrate() {
    try {
        console.log('🚀 Starting migration from MongoDB to Supabase...');
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        // Run migrations
        await migrateUsers();
        await migrateAppUsers();
        await migratePlans();
        console.log('✅ Migration completed successfully!');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
    }
    finally {
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}
// Run migration
migrate();
//# sourceMappingURL=migrate-to-supabase.js.map