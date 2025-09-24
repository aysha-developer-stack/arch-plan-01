import { SupabaseStorage } from './server/storage.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: 'server/.env' });
dotenv.config();

async function debugStorageMethod() {
  try {
    console.log('🔍 Testing SupabaseStorage.getFileUrl method...\n');
    
    const storage = new SupabaseStorage();
    const fileName = '1758711584496-fhbgn.pdf';
    
    console.log(`📝 Calling storage.getFileUrl('${fileName}')...`);
    
    try {
      const signedUrl = await storage.getFileUrl(fileName);
      console.log('✅ Success! Signed URL:', signedUrl);
      
      // Test fetching the file
      console.log('\n📝 Testing file fetch...');
      const response = await fetch(signedUrl);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const contentLength = response.headers.get('content-length');
        console.log('✅ File fetch successful! Content length:', contentLength);
      } else {
        console.log('❌ File fetch failed:', response.statusText);
      }
      
    } catch (error) {
      console.error('❌ Error in storage.getFileUrl:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
  } catch (error) {
    console.error('❌ General error:', error);
  }
}

debugStorageMethod();