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

async function checkFilesInStorage() {
  try {
    console.log('Checking files in Supabase storage...\n');
    
    // Get all files from the plan-files bucket
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('plan-files')
      .list('', { limit: 100 });
    
    if (storageError) {
      console.error('Error listing storage files:', storageError);
      return;
    }
    
    console.log(`Found ${storageFiles.length} files in Supabase storage:`);
    storageFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name} (${file.metadata?.size || 'unknown size'} bytes)`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Get files from database
    const { data: plans, error: dbError } = await supabase
      .from('plans')
      .select('id, title, file_url, filePath, file_name')
      .not('file_url', 'is', null);
    
    if (dbError) {
      console.error('Error fetching plans from database:', dbError);
      return;
    }
    
    console.log('Checking if database files exist in storage:\n');
    
    const storageFileNames = storageFiles.map(f => f.name);
    
    for (const plan of plans) {
      const fileName = plan.file_url;
      const exists = storageFileNames.includes(fileName);
      const status = exists ? '✅' : '❌';
      
      console.log(`${status} ${plan.title}`);
      console.log(`   File: ${fileName}`);
      console.log(`   Exists in storage: ${exists}`);
      console.log(`   Plan ID: ${plan.id}`);
      
      if (exists) {
        // Try to create a signed URL to verify access
        try {
          const { data: signedUrl, error: urlError } = await supabase.storage
            .from('plan-files')
            .createSignedUrl(fileName, 60);
          
          if (urlError) {
            console.log(`   ⚠️  Error creating signed URL: ${urlError.message}`);
          } else {
            console.log(`   ✅ Signed URL created successfully`);
          }
        } catch (err) {
          console.log(`   ❌ Failed to create signed URL: ${err.message}`);
        }
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkFilesInStorage();