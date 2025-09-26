import { supabase } from './server/db.ts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixDatabasePaths() {
  try {
    console.log('Fixing database file paths...\n');
    
    // First, check current state
    console.log('Step 1: Checking current file paths in database');
    const { data: currentPlans, error: fetchError } = await supabase
      .from('plans')
      .select('id, title, filePath, file_url, file_name')
      .not('filePath', 'is', null);
    
    if (fetchError) {
      console.error('Error fetching plans:', fetchError);
      return;
    }
    
    console.log(`Found ${currentPlans.length} plans with file paths`);
    
    // Check which ones have uploads/ prefix
    const plansWithUploadsPrefix = currentPlans.filter(plan => 
      plan.filePath && plan.filePath.startsWith('uploads/')
    );
    
    console.log(`Plans with 'uploads/' prefix: ${plansWithUploadsPrefix.length}`);
    
    if (plansWithUploadsPrefix.length > 0) {
      console.log('\nPlans that need fixing:');
      plansWithUploadsPrefix.forEach(plan => {
        console.log(`- ${plan.title}: ${plan.filePath}`);
      });
    }
    
    // Update filePath to remove uploads/ prefix
    console.log('\nStep 2: Updating filePath column to remove uploads/ prefix');
    const { data: updatedPlans, error: updateError } = await supabase
      .rpc('update_file_paths_remove_uploads');
    
    if (updateError) {
      console.log('RPC function not found, using direct SQL update...');
      
      // Use direct SQL update
      const { data: sqlResult, error: sqlError } = await supabase
        .from('plans')
        .update({})
        .eq('filePath', supabase.raw(`REPLACE("filePath", 'uploads/', '')`))
        .like('filePath', 'uploads/%')
        .select();
      
      if (sqlError) {
        console.error('Error with SQL update:', sqlError);
        
        // Manual update approach
        console.log('Trying manual update approach...');
        for (const plan of plansWithUploadsPrefix) {
          const newFilePath = plan.filePath.replace('uploads/', '');
          const { error: manualError } = await supabase
            .from('plans')
            .update({
              filePath: newFilePath,
              file_url: newFilePath,
              file_name: newFilePath
            })
            .eq('id', plan.id);
          
          if (manualError) {
            console.error(`Error updating plan ${plan.id}:`, manualError);
          } else {
            console.log(`✅ Updated ${plan.title}: ${plan.filePath} → ${newFilePath}`);
          }
        }
      } else {
        console.log('✅ SQL update completed');
      }
    } else {
      console.log('✅ RPC update completed');
    }
    
    // Verify the changes
    console.log('\nStep 3: Verifying changes');
    const { data: verifyPlans, error: verifyError } = await supabase
      .from('plans')
      .select('id, title, filePath, file_url, file_name')
      .not('filePath', 'is', null);
    
    if (verifyError) {
      console.error('Error verifying changes:', verifyError);
      return;
    }
    
    const stillHaveUploadsPrefix = verifyPlans.filter(plan => 
      plan.filePath && plan.filePath.startsWith('uploads/')
    );
    
    console.log(`Plans still with 'uploads/' prefix: ${stillHaveUploadsPrefix.length}`);
    
    if (stillHaveUploadsPrefix.length === 0) {
      console.log('✅ All file paths have been corrected!');
    } else {
      console.log('❌ Some plans still need fixing:');
      stillHaveUploadsPrefix.forEach(plan => {
        console.log(`- ${plan.title}: ${plan.filePath}`);
      });
    }
    
    console.log('\nFinal file paths:');
    verifyPlans.forEach(plan => {
      console.log(`- ${plan.title}: ${plan.filePath}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixDatabasePaths();