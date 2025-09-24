import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });
dotenv.config({ path: 'server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSpecificPlan() {
  const planId = '6b7dc2b9-8265-463d-a7fa-2bc76f948b25';
  
  console.log(`\n=== Fixing Plan ID: ${planId} ===`);
  
  // 1. Get the plan details
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();
    
  if (planError) {
    console.error('Plan not found:', planError.message);
    return;
  }
  
  console.log('Plan details:');
  console.log(`  Title: ${plan.title}`);
  console.log(`  Current filePath: ${plan.filePath || 'NULL'}`);
  console.log(`  Created: ${plan.created_at}`);
  
  // 2. Based on the debug output, the matching files are:
  // 1758719701705-12.PNG, 1758719702455-14.PNG, 1758719702982-13.PNG, 1758719703695-fhbgn.pdf
  
  // The PDF file seems to be the main plan file
  const matchingPdfFile = '1758719703695-fhbgn.pdf';
  
  console.log(`\n2. Updating plan to use file: ${matchingPdfFile}`);
  
  // 3. Verify the file exists in storage
  const { data: fileData, error: fileError } = await supabase.storage
    .from('plan-files')
    .download(matchingPdfFile);
    
  if (fileError) {
    console.error('File not found in storage:', fileError.message);
    return;
  }
  
  console.log(`✅ File verified in storage, size: ${fileData.size} bytes`);
  
  // 4. Update the plan record
  const { error: updateError } = await supabase
    .from('plans')
    .update({ 
      filePath: matchingPdfFile,
      file_url: `https://${supabaseUrl.split('//')[1]}/storage/v1/object/public/plan-files/${matchingPdfFile}`
    })
    .eq('id', planId);
    
  if (updateError) {
    console.error('Failed to update plan:', updateError.message);
    return;
  }
  
  console.log('✅ Plan updated successfully!');
  
  // 5. Test the download
  console.log('\n3. Testing download...');
  const { data: testDownload, error: downloadError } = await supabase.storage
    .from('plan-files')
    .download(matchingPdfFile);
    
  if (downloadError) {
    console.error('Download test failed:', downloadError.message);
  } else {
    console.log(`✅ Download test successful, file size: ${testDownload.size} bytes`);
  }
  
  console.log('\n🎉 Fix completed! The plan should now be downloadable.');
}

fixSpecificPlan().catch(console.error);