import { getStorage } from './server/storage.ts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkSpecificPlan() {
  try {
    const planId = '529010b0-1a20-47af-9594-3c0d23d1cbef'; // Big House
    const storage = getStorage();
    
    console.log('Checking specific plan from database...\n');
    
    const plan = await storage.getPlan(planId);
    
    if (!plan) {
      console.log('❌ Plan not found');
      return;
    }
    
    console.log('Plan data from database:');
    console.log('ID:', plan.id);
    console.log('Title:', plan.title);
    console.log('file_url:', plan.file_url);
    console.log('filePath:', plan.filePath);
    console.log('file_name:', plan.file_name);
    console.log('fileName:', plan.fileName);
    
    // Check if file_url is a signed URL or filename
    const isSignedUrl = plan.file_url && plan.file_url.startsWith('http');
    console.log('\nIs file_url a signed URL?', isSignedUrl);
    
    if (isSignedUrl) {
      console.log('❌ PROBLEM: file_url contains a signed URL, not a filename');
      
      // Extract filename from the signed URL
      const urlParts = plan.file_url.split('/');
      const filenamePart = urlParts.find(part => part.includes('.pdf'));
      if (filenamePart) {
        const filename = filenamePart.split('?')[0]; // Remove query parameters
        console.log('Extracted filename:', filename);
      }
    } else {
      console.log('✅ file_url contains a filename');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSpecificPlan();