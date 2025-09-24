import { supabase } from './server/db.ts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixDatabasePathsSimple() {
  try {
    console.log('Fixing database file paths (simple approach)...\n');
    
    // First, get all plans with file paths
    console.log('Step 1: Fetching all plans with file paths');
    const { data: plans, error: fetchError } = await supabase
      .from('plans')
      .select('id, title, filePath, file_url, file_name')
      .not('filePath', 'is', null);
    
    if (fetchError) {
      console.error('Error fetching plans:', fetchError);
      return;
    }
    
    console.log(`Found ${plans.length} plans with file paths\n`);
    
    // Show current state
    console.log('Current file paths:');
    plans.forEach(plan => {
      console.log(`- ${plan.title}: filePath="${plan.filePath}", file_url="${plan.file_url}"`);
    });
    
    console.log('\nStep 2: Updating each plan to remove uploads/ prefix and ensure consistency');
    
    let updatedCount = 0;
    
    for (const plan of plans) {
      let needsUpdate = false;
      let newFilePath = plan.filePath;
      let newFileUrl = plan.file_url;
      let newFileName = plan.file_name;
      
      // Remove uploads/ prefix from filePath if present
      if (plan.filePath && plan.filePath.startsWith('uploads/')) {
        newFilePath = plan.filePath.replace('uploads/', '');
        needsUpdate = true;
      }
      
      // Ensure file_url is just the filename (not a signed URL)
      if (plan.file_url && plan.file_url.startsWith('http')) {
        // Extract filename from signed URL
        const urlParts = plan.file_url.split('/');
        const filenamePart = urlParts.find(part => part.includes('.pdf') || part.includes('.PNG'));
        if (filenamePart) {
          newFileUrl = filenamePart.split('?')[0]; // Remove query parameters
          needsUpdate = true;
        }
      }
      
      // Ensure file_name matches the corrected filename
      if (newFileName !== newFilePath) {
        newFileName = newFilePath;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('plans')
          .update({
            filePath: newFilePath,
            file_url: newFileUrl,
            file_name: newFileName
          })
          .eq('id', plan.id);
        
        if (updateError) {
          console.error(`❌ Error updating plan ${plan.title}:`, updateError);
        } else {
          console.log(`✅ Updated ${plan.title}:`);
          console.log(`   filePath: "${plan.filePath}" → "${newFilePath}"`);
          console.log(`   file_url: "${plan.file_url}" → "${newFileUrl}"`);
          console.log(`   file_name: "${plan.file_name}" → "${newFileName}"`);
          updatedCount++;
        }
      } else {
        console.log(`✓ ${plan.title}: No changes needed`);
      }
    }
    
    console.log(`\nStep 3: Summary`);
    console.log(`Total plans processed: ${plans.length}`);
    console.log(`Plans updated: ${updatedCount}`);
    
    // Verify final state
    console.log('\nStep 4: Verifying final state');
    const { data: finalPlans, error: finalError } = await supabase
      .from('plans')
      .select('id, title, filePath, file_url, file_name')
      .not('filePath', 'is', null);
    
    if (finalError) {
      console.error('Error fetching final state:', finalError);
      return;
    }
    
    console.log('\nFinal file paths:');
    finalPlans.forEach(plan => {
      console.log(`- ${plan.title}: filePath="${plan.filePath}", file_url="${plan.file_url}"`);
    });
    
    // Check for any remaining issues
    const hasUploadsPrefix = finalPlans.some(plan => 
      plan.filePath && plan.filePath.startsWith('uploads/')
    );
    const hasSignedUrls = finalPlans.some(plan => 
      plan.file_url && plan.file_url.startsWith('http')
    );
    
    if (!hasUploadsPrefix && !hasSignedUrls) {
      console.log('\n✅ All file paths have been corrected successfully!');
    } else {
      console.log('\n❌ Some issues remain:');
      if (hasUploadsPrefix) console.log('- Some filePaths still have uploads/ prefix');
      if (hasSignedUrls) console.log('- Some file_urls are still signed URLs');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixDatabasePathsSimple();