import { supabase } from './server/db.ts';

async function checkSupabaseStorage() {
  const imagePath = '1758693638191-14.PNG';
  
  console.log(`🔍 Checking if ${imagePath} exists in Supabase Storage...`);
  
  try {
    // List files in the bucket to see what's there
    const { data: files, error: listError } = await supabase.storage
      .from('plan-files')
      .list('', {
        limit: 100,
        offset: 0
      });
    
    if (listError) {
      console.error('❌ Error listing files:', listError);
      return;
    }
    
    console.log('📁 Files in Supabase Storage:');
    files.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name} (${file.metadata?.size || 'unknown size'})`);
      if (file.name === imagePath) {
        console.log(`    ✅ Found our target file!`);
      }
    });
    
    // Check if our specific file exists
    const targetFile = files.find(f => f.name === imagePath);
    if (targetFile) {
      console.log(`\n✅ File ${imagePath} exists in Supabase Storage`);
      
      // Try to get a signed URL
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('plan-files')
        .createSignedUrl(imagePath, 60); // 60 seconds expiry
      
      if (urlError) {
        console.error('❌ Error creating signed URL:', urlError);
      } else {
        console.log('🔗 Signed URL:', signedUrlData.signedUrl);
      }
    } else {
      console.log(`\n❌ File ${imagePath} NOT found in Supabase Storage`);
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkSupabaseStorage();