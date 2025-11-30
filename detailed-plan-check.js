import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function checkDetailedPlanData() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env file');
    return;
  }

  console.log('🔍 Connecting to MongoDB...');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    const dbName = new URL(uri).pathname.slice(1) || 'test';
    const db = client.db(dbName);
    
    const plansCollection = db.collection('plans');
    const plans = await plansCollection.find({}).toArray();
    
    console.log(`\n📊 Found ${plans.length} plans in database`);
    
    plans.forEach((plan, index) => {
      console.log(`\n=== PLAN ${index + 1}: ${plan.title || 'Untitled'} ===`);
      
      // Check all fields and their values
      const fields = [
        'title', 'planType', 'storeys', 'bedrooms', 'toilets', 'livingAreas',
        'houseType', 'lotSize', 'lotSizeMin', 'lotSizeMax', 'orientation',
        'plotLength', 'plotWidth', 'coveredArea', 'totalBuildingHeight',
        'roofPitch', 'roadPosition', 'siteType', 'foundation',
        'constructionType', 'builderDesigner', 'councilArea', 'fileName',
        'status', 'createdAt', 'updatedAt', 'description', 'outdoorFeatures',
        'indoorFeatures'
      ];
      
      fields.forEach(field => {
        const value = plan[field];
        let displayValue;
        
        if (value === null || value === undefined) {
          displayValue = '❌ NULL/UNDEFINED';
        } else if (value === '') {
          displayValue = '⚠️  EMPTY STRING';
        } else if (Array.isArray(value)) {
          displayValue = value.length === 0 ? '📝 EMPTY ARRAY' : `📋 [${value.join(', ')}]`;
        } else {
          displayValue = `✅ ${JSON.stringify(value)}`;
        }
        
        console.log(`  ${field}: ${displayValue}`);
      });
      
      // Check for any additional fields not in our list
      const additionalFields = Object.keys(plan).filter(key => !fields.includes(key) && key !== '_id');
      if (additionalFields.length > 0) {
        console.log('\n  🔍 Additional fields:');
        additionalFields.forEach(field => {
          console.log(`    ${field}: ${JSON.stringify(plan[field])}`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkDetailedPlanData().catch(console.error);