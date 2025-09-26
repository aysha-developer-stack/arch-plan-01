import { SupabaseStorage } from './server/storage.ts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function debugStorageClass() {
  try {
    console.log('Testing SupabaseStorage class directly...\n');
    
    const storage = new SupabaseStorage();
    const fileName = '1758711584496-fhbgn.pdf'; // Big House file
    
    console.log(`Testing getFileUrl with: ${fileName}`);
    
    try {
      const signedUrl = await storage.getFileUrl(fileName);
      console.log(`✅ SupabaseStorage.getFileUrl succeeded: ${signedUrl}`);
      
      // Test the signed URL
      const response = await fetch(signedUrl, { method: 'HEAD' });
      console.log(`✅ Signed URL is accessible: ${response.status} ${response.statusText}`);
      
    } catch (error) {
      console.log(`❌ SupabaseStorage.getFileUrl failed: ${error.message}`);
      console.log('Error details:', error);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugStorageClass();