import { getStorage } from './server/storage.ts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testDownloadRouteLogic() {
  try {
    console.log('Testing exact download route logic...\n');
    
    const planId = '529010b0-1a20-47af-9594-3c0d23d1cbef'; // Big House
    const storage = getStorage();
    
    console.log('Step 1: Getting storage instance');
    console.log('Storage instance created:', !!storage);
    
    console.log('\nStep 2: Fetching plan from database');
    const plan = await storage.getPlan(planId);
    
    if (!plan) {
      console.log('❌ Plan not found');
      return;
    }
    
    console.log('✅ Plan found:', {
      id: plan.id,
      title: plan.title,
      fileName: plan.fileName,
      filePath: plan.filePath,
      file_url: plan.file_url
    });
    
    console.log('\nStep 3: Checking if file_url exists');
    if (!plan.file_url) {
      console.log('❌ No file_url in plan');
      return;
    }
    
    console.log('✅ file_url exists:', plan.file_url);
    
    console.log('\nStep 4: Attempting to get signed URL');
    const filePathForStorage = plan.file_url;
    console.log('Using file path for Supabase:', filePathForStorage);
    
    try {
      console.log('Calling storage.getFileUrl...');
      const signedUrl = await storage.getFileUrl(filePathForStorage);
      console.log('✅ Generated signed URL successfully:', signedUrl);
      
      console.log('\nStep 5: Testing signed URL');
      const response = await fetch(signedUrl, { method: 'HEAD' });
      console.log(`✅ Signed URL is accessible: ${response.status} ${response.statusText}`);
      
    } catch (error) {
      console.log('❌ Error in storage.getFileUrl:', error.message);
      console.log('Error details:', error);
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testDownloadRouteLogic();