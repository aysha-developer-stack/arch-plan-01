import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Plan } from './server/src/schema.ts';

dotenv.config();

async function indexUploadedFiles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const uploadsDir = './uploads';
    const files = fs.readdirSync(uploadsDir);
    
    console.log(`📁 Found ${files.length} files in uploads directory`);

    for (const file of files) {
      if (file.endsWith('.pdf')) {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        
        // Check if plan already exists
        const existingPlan = await Plan.findOne({ fileName: file });
        if (existingPlan) {
          console.log(`⏭️  Plan already exists: ${file}`);
          continue;
        }

        // Create sample plan data based on filename pattern
        const planData = {
          title: `Architectural Plan ${file.replace('.pdf', '').replace(/^\d+-/, '')}`,
          description: 'Professional architectural plan with detailed floor layouts and specifications',
          fileName: file,
          filePath: filePath,
          fileSize: stats.size,
          planType: 'Residential',
          storeys: Math.floor(Math.random() * 2) + 1, // Random 1-2 storeys
          lotSize: ['Small (< 400m²)', 'Medium (400-800m²)', 'Large (> 800m²)'][Math.floor(Math.random() * 3)],
          orientation: ['North Facing', 'South Facing', 'East Facing', 'West Facing'][Math.floor(Math.random() * 4)],
          siteType: ['Levelled', 'Step Up', 'Step Down'][Math.floor(Math.random() * 3)],
          foundationType: ['Slab', 'Stumps', 'Half Slab', 'Half Stump'][Math.floor(Math.random() * 4)],
          councilArea: ['Sydney City', 'Melbourne City', 'Brisbane City', 'Perth City'][Math.floor(Math.random() * 4)],
          bedrooms: Math.floor(Math.random() * 4) + 2, // Random 2-5 bedrooms
          toilets: Math.floor(Math.random() * 2) + 2, // Random 2-3 toilets
          houseType: ['Single Dwelling', 'Duplex', 'Townhouse'][Math.floor(Math.random() * 3)],
          constructionType: [['Brick'], ['Cladding'], ['Hebel'], ['NRG'], ['Brick', 'Cladding']][Math.floor(Math.random() * 5)],
          builderName: ['VividArch Designs', 'Premium Plans Co', 'Modern Home Designs'][Math.floor(Math.random() * 3)],
          status: 'active',
          downloadCount: 0
        };

        const newPlan = new Plan(planData);
        await newPlan.save();
        
        console.log(`✅ Indexed: ${file} -> ${planData.title}`);
      }
    }

    console.log('🎉 File indexing completed successfully!');
    
  } catch (error) {
    console.error('❌ Error indexing files:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the indexing
indexUploadedFiles();
