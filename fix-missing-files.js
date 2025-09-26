import { supabase } from './server/db.ts';

async function fixMissingFiles() {
  try {
    console.log('🔍 Finding plans with missing files in Supabase Storage...');
    
    // Get all plans with file_url
    const { data: plans, error } = await supabase
      .from('plans')
      .select('id, title, file_url, fileName')
      .not('file_url', 'is', null);
    
    if (error) {
      console.error('❌ Error fetching plans:', error);
      return;
    }
    
    console.log(`📊 Found ${plans.length} plans with file_url`);
    
    // Get list of files in Supabase Storage
    const { data: files, error: listError } = await supabase.storage
      .from('plan-files')
      .list('', { limit: 1000 });
    
    if (listError) {
      console.error('❌ Error listing files:', listError);
      return;
    }
    
    const fileNames = files.map(f => f.name);
    console.log(`📁 Found ${fileNames.length} files in Supabase Storage`);
    
    // Check each plan
    const missingFiles = [];
    const validFiles = [];
    
    for (const plan of plans) {
      if (fileNames.includes(plan.file_url)) {
        validFiles.push(plan);
        console.log(`✅ ${plan.title}: File exists`);
      } else {
        missingFiles.push(plan);
        console.log(`❌ ${plan.title}: File missing (${plan.file_url})`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Plans with valid files: ${validFiles.length}`);
    console.log(`❌ Plans with missing files: ${missingFiles.length}`);
    
    if (missingFiles.length > 0) {
      console.log(`\n🔧 Plans that need fixing:`);
      missingFiles.forEach((plan, index) => {
        console.log(`${index + 1}. ID: ${plan.id}`);
        console.log(`   Title: ${plan.title}`);
        console.log(`   Missing file: ${plan.file_url}`);
        console.log(`   Original filename: ${plan.fileName}`);
        console.log('');
      });
      
      // Option 1: Clear file_url for missing files so they fall back to local files
      console.log('🔧 Clearing file_url for plans with missing files...');
      
      for (const plan of missingFiles) {
        const { error: updateError } = await supabase
          .from('plans')
          .update({ file_url: null })
          .eq('id', plan.id);
        
        if (updateError) {
          console.error(`❌ Error updating plan ${plan.id}:`, updateError);
        } else {
          console.log(`✅ Cleared file_url for plan: ${plan.title}`);
        }
      }
    }
    
  } catch (err) {
    console.error('❌ Script error:', err);
  }
}

fixMissingFiles();