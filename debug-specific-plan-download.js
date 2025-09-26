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

async function debugSpecificPlan() {
  const planId = '6b7dc2b9-8265-463d-a7fa-2bc76f948b25';
  
  console.log(`\n=== Debugging Plan ID: ${planId} ===`);
  
  // 1. Check if plan exists in database
  console.log('\n1. Checking plan in database...');
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();
    
  if (planError) {
    console.error('Plan not found in database:', planError.message);
    return;
  }
  
  console.log('Plan found:', {
    id: plan.id,
    title: plan.title,
    filePath: plan.filePath,
    fileName: plan.fileName,
    fileSize: plan.fileSize,
    createdAt: plan.createdAt
  });
  
  // 2. Check if file exists in storage
  console.log('\n2. Checking file in storage...');
  if (plan.filePath) {
    const { data: fileData, error: fileError } = await supabase.storage
      .from('plan-files')
      .download(plan.filePath);
      
    if (fileError) {
      console.error('File not found in storage:', fileError.message);
      console.log('Stored filePath:', plan.filePath);
    } else {
      console.log('File found in storage, size:', fileData.size);
    }
  } else {
    console.log('No filePath stored in database');
  }
  
  // 3. List all files in storage to see what's actually there
  console.log('\n3. Listing files in storage bucket...');
  const { data: files, error: listError } = await supabase.storage
    .from('plan-files')
    .list('', { limit: 100 });
    
  if (listError) {
    console.error('Error listing files:', listError.message);
  } else {
    console.log('Files in storage:');
    files.forEach(file => {
      console.log(`  - ${file.name} (${file.metadata?.size || 'unknown size'})`);
    });
  }
}

debugSpecificPlan().catch(console.error);