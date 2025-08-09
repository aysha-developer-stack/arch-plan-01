import { storage } from './server/storage.ts';

async function listAllPlans() {
  try {
    console.log('🔍 Fetching all plans from database...');
    const plans = await storage.getPlans();
    console.log('📊 Total plans found:', plans.length);
    
    if (plans.length === 0) {
      console.log('❌ No plans found in database');
      return;
    }
    
    plans.forEach((plan, index) => {
      console.log(`\n${index + 1}. Plan Details:`);
      console.log(`   ID: ${plan._id}`);
      console.log(`   Title: ${plan.title}`);
      console.log(`   File Name: ${plan.fileName}`);
      console.log(`   File Path: ${plan.filePath}`);
      console.log(`   Upload Date: ${plan.uploadDate}`);
      console.log(`   Has Content: ${plan.content ? 'Yes' : 'No'}`);
      console.log('   ---');
    });
  } catch (error) {
    console.error('❌ Error fetching plans:', error);
  } finally {
    process.exit(0);
  }
}

listAllPlans();
