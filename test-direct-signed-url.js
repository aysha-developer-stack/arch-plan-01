import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDirectSignedUrl() {
  try {
    console.log('Testing direct signed URL creation...\n');
    
    const testFiles = [
      '1758711584496-fhbgn.pdf', // Big House
      '1758719703695-fhbgn.pdf', // hfj
      '1758693640879-fhbgn.pdf', // xczvfb
    ];
    
    for (const fileName of testFiles) {
      console.log(`Testing file: ${fileName}`);
      
      // First, check if file exists
      const { data: fileData, error: fileError } = await supabase.storage
        .from('plan-files')
        .list('', { search: fileName });
      
      if (fileError) {
        console.log(`❌ Error listing files: ${fileError.message}`);
        continue;
      }
      
      const fileExists = fileData.some(f => f.name === fileName);
      console.log(`File exists in storage: ${fileExists}`);
      
      if (!fileExists) {
        console.log(`❌ File ${fileName} not found in storage`);
        continue;
      }
      
      // Try to create signed URL
      console.log('Creating signed URL...');
      const { data, error } = await supabase.storage
        .from('plan-files')
        .createSignedUrl(fileName, 60 * 60); // 1 hour expiry
      
      if (error) {
        console.log(`❌ Error creating signed URL: ${error.message}`);
        console.log('Error details:', error);
      } else if (!data || !data.signedUrl) {
        console.log('❌ No data returned from createSignedUrl');
      } else {
        console.log(`✅ Signed URL created successfully: ${data.signedUrl}`);
        
        // Test the signed URL
        try {
          const response = await fetch(data.signedUrl, { method: 'HEAD' });
          console.log(`✅ Signed URL is accessible: ${response.status} ${response.statusText}`);
        } catch (fetchError) {
          console.log(`❌ Error accessing signed URL: ${fetchError.message}`);
        }
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testDirectSignedUrl();