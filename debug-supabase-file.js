import { supabase } from './server/db.ts';

async function debugSupabaseFile() {
  try {
    const planId = '529010b0-1a20-47af-9594-3c0d23d1cbef';
    console.log(`🔍 Debugging Supabase file for plan ${planId}...`);
    
    // Get the plan from database
    const { data: plan, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (error) {
      console.error('❌ Error fetching plan:', error);
      return;
    }
    
    console.log('✅ Plan found:', plan.title);
    console.log('📁 File URL in database:', plan.file_url);
    console.log('📄 File name:', plan.fileName);
    console.log('📏 File size:', plan.fileSize);
    
    if (plan.file_url) {
      console.log('\n🔗 Testing Supabase Storage access...');
      
      // Try to create a signed URL
      try {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('plan-files')
          .createSignedUrl(plan.file_url, 60);
        
        if (signedUrlError) {
          console.error('❌ Error creating signed URL:', signedUrlError);
        } else {
          console.log('✅ Signed URL created:', signedUrlData.signedUrl);
          
          // Try to fetch the file
          try {
            const response = await fetch(signedUrlData.signedUrl, { method: 'HEAD' });
            console.log('📊 File fetch status:', response.status, response.statusText);
            
            if (response.ok) {
              console.log('✅ File is accessible via signed URL');
              console.log('📋 Content-Type:', response.headers.get('content-type'));
              console.log('📏 Content-Length:', response.headers.get('content-length'));
            } else {
              console.log('❌ File is not accessible via signed URL');
            }
          } catch (fetchError) {
            console.error('❌ Error fetching file:', fetchError.message);
          }
        }
      } catch (storageError) {
        console.error('❌ Storage error:', storageError);
      }
      
      // List files in the bucket to see what's actually there
      console.log('\n📂 Listing files in plan-files bucket...');
      try {
        const { data: files, error: listError } = await supabase.storage
          .from('plan-files')
          .list('', { limit: 10 });
        
        if (listError) {
          console.error('❌ Error listing files:', listError);
        } else {
          console.log('📁 Files in bucket:');
          files.forEach((file, index) => {
            console.log(`  ${index + 1}. ${file.name} (${file.metadata?.size || 'unknown size'})`);
          });
          
          // Check if our file is in the list
          const ourFile = files.find(f => f.name === plan.file_url);
          if (ourFile) {
            console.log(`✅ Our file "${plan.file_url}" is in the bucket`);
          } else {
            console.log(`❌ Our file "${plan.file_url}" is NOT in the bucket`);
          }
        }
      } catch (listError) {
        console.error('❌ List error:', listError);
      }
    } else {
      console.log('❌ No file_url in database');
    }
    
  } catch (err) {
    console.error('❌ Script error:', err);
  }
}

debugSupabaseFile();