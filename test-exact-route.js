import { getStorage } from './server/storage.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: 'server/.env' });
dotenv.config();

async function testExactRoute() {
  try {
    console.log('🔍 Testing exact route implementation...\n');
    
    const storage = getStorage();
    const planId = '529010b0-1a20-47af-9594-3c0d23d1cbef';
    
    console.log('📝 Step 1: Getting plan from storage...');
    const plan = await storage.getPlan(planId);
    
    if (!plan) {
      console.error('❌ Plan not found');
      return;
    }
    
    console.log('✅ Plan found:', {
      id: plan.id,
      title: plan.title,
      file_url: plan.file_url,
      filePath: plan.filePath,
      fileName: plan.fileName
    });
    
    console.log('\n📝 Step 2: Checking file_url availability...');
    if (plan.file_url) {
      console.log(`✅ file_url available: ${plan.file_url}`);
      
      console.log('\n📝 Step 3: Attempting to get signed URL...');
      try {
        const filePathForStorage = plan.file_url;
        console.log(`Using file path for Supabase: ${filePathForStorage}`);
        
        const signedUrl = await storage.getFileUrl(filePathForStorage);
        console.log('✅ Signed URL generated successfully:', signedUrl);
        
        console.log('\n📝 Step 4: Testing file fetch...');
        const response = await fetch(signedUrl);
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const contentLength = response.headers.get('content-length');
          console.log('✅ File fetch successful! Content length:', contentLength);
          console.log('🎉 Route should work perfectly!');
        } else {
          console.log('❌ File fetch failed:', response.statusText);
        }
        
      } catch (error) {
        console.error('❌ Error in getFileUrl:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
    } else {
      console.log('❌ No file_url available');
    }
    
  } catch (error) {
    console.error('❌ General error:', error);
  }
}

testExactRoute();