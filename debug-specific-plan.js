import { supabase } from './server/db.ts';

async function debugSpecificPlan() {
  try {
    const planId = '529010b0-1a20-47af-9594-3c0d23d1cbef';
    console.log(`🔍 Debugging plan: ${planId}`);
    
    // Get the plan details
    const { data: plan, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (error) {
      console.error('❌ Error fetching plan:', error);
      return;
    }
    
    console.log('\n📋 Plan details:');
    console.log(`Title: ${plan.title}`);
    console.log(`File URL: ${plan.file_url || 'None'}`);
    console.log(`File Name: ${plan.file_name || 'None'}`);
    console.log(`File Path: ${plan.filePath || 'None'}`);
    console.log(`File Size: ${plan.file_size || 'None'}`);
    
    // Check if file exists in Supabase Storage
    if (plan.file_url) {
      console.log('\n🔍 Checking Supabase Storage...');
      const { data: fileData, error: fileError } = await supabase.storage
        .from('plan-files')
        .list('', { limit: 1000 });
      
      if (fileError) {
        console.error('❌ Error listing files:', fileError);
      } else {
        const fileExists = fileData.some(f => f.name === plan.file_url);
        console.log(`File exists in storage: ${fileExists ? '✅ Yes' : '❌ No'}`);
        
        if (!fileExists) {
          console.log('\n📁 Available files in storage:');
          fileData.forEach((file, index) => {
            console.log(`${index + 1}. ${file.name}`);
          });
        }
      }
    }
    
    // Check local uploads directory
    console.log('\n🔍 Checking local uploads directory...');
    const fs = await import('fs');
    const path = await import('path');
    
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`Found ${files.length} files in uploads directory:`);
      files.forEach((file, index) => {
        console.log(`${index + 1}. ${file}`);
      });
      
      // Look for potential matches
      const potentialMatches = files.filter(file => 
        file.includes('Big House') || 
        file.includes(planId) ||
        file.includes('529010b0')
      );
      
      if (potentialMatches.length > 0) {
        console.log('\n🎯 Potential file matches:');
        potentialMatches.forEach(match => console.log(`- ${match}`));
      }
    } else {
      console.log('❌ Uploads directory does not exist');
    }
    
  } catch (err) {
    console.error('❌ Script error:', err);
  }
}

debugSpecificPlan();