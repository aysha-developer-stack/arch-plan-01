import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: 'server/.env' });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorageFiles() {
  try {
    console.log('🔍 Checking files in Supabase Storage...\n');
    
    // List all files in the plan-files bucket
    const { data: files, error } = await supabase.storage
      .from('plan-files')
      .list('', {
        limit: 100,
        offset: 0
      });

    if (error) {
      console.error('Error listing files:', error);
      return;
    }

    console.log(`📁 Found ${files.length} files in plan-files bucket:`);
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name} (${file.metadata?.size || 'unknown size'})`);
    });

    // Check if our specific file exists
    const targetFile = '1758711584496-fhbgn.pdf';
    const fileExists = files.some(file => file.name === targetFile);
    
    console.log(`\n🎯 Target file "${targetFile}" exists: ${fileExists ? '✅ YES' : '❌ NO'}`);
    
    if (fileExists) {
      // Try to get a signed URL for the file
      const { data: signedUrl, error: urlError } = await supabase.storage
        .from('plan-files')
        .createSignedUrl(targetFile, 60);
        
      if (urlError) {
        console.error('Error creating signed URL:', urlError);
      } else {
        console.log('✅ Signed URL created successfully:', signedUrl.signedUrl);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkStorageFiles();