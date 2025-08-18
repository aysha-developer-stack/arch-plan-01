import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function checkPlanFields() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('Archplan');
    const plans = await db.collection('plans').find({}).toArray();
    
    console.log(`Found ${plans.length} plans:\n`);
    
    plans.forEach((plan, index) => {
      console.log(`=== PLAN ${index + 1}: ${plan.title} ===`);
      
      // Only show the key fields that appear in the UI
      const keyFields = {
        'Plan Type': plan.planType,
        'Storeys': plan.storeys,
        'Bedrooms': plan.bedrooms,
        'Toilets': plan.toilets,
        'Living Areas': plan.livingAreas,
        'House Type': plan.houseType,
        'Lot Size': plan.lotSize,
        'Lot Size Min': plan.lotSizeMin,
        'Lot Size Max': plan.lotSizeMax,
        'Orientation': plan.orientation,
        'Plot Length': plan.plotLength,
        'Plot Width': plan.plotWidth,
        'Covered Area': plan.coveredArea,
        'Total Building Height': plan.totalBuildingHeight,
        'Roof Pitch': plan.roofPitch,
        'Road Position': plan.roadPosition,
        'Site Type': plan.siteType,
        'Foundation': plan.foundation,
        'Construction Type': plan.constructionType,
        'Builder/Designer': plan.builderDesigner,
        'Council Area': plan.councilArea,
        'Status': plan.status,
        'Description': plan.description,
        'Outdoor Features': plan.outdoorFeatures,
        'Indoor Features': plan.indoorFeatures
      };
      
      Object.entries(keyFields).forEach(([label, value]) => {
        let status;
        if (value === null || value === undefined) {
          status = '❌ NULL (shows as N/A)';
        } else if (value === '') {
          status = '⚠️  EMPTY STRING (shows as N/A)';
        } else if (Array.isArray(value) && value.length === 0) {
          status = '📝 EMPTY ARRAY (shows as N/A)';
        } else {
          status = `✅ ${JSON.stringify(value)}`;
        }
        console.log(`  ${label}: ${status}`);
      });
      
      console.log(''); // Empty line between plans
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

checkPlanFields().catch(console.error);