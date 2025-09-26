import { supabase } from './server/db.ts';

async function fixFilePaths() {
  try {
    const planId = '529010b0-1a20-47af-9594-3c0d23d1cbef';
    console.log(`🔧 Fixing file paths for plan: ${planId}`);
    
    // Get the current plan
    const { data: plan, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (error) {
      console.error('❌ Error fetching plan:', error);
      return;
    }
    
    console.log('\n📋 Current plan data:');
    console.log(`Title: ${plan.title}`);
    console.log(`File URL: ${plan.file_url}`);
    console.log(`File Path: ${plan.filePath}`);
    console.log(`File Name: ${plan.file_name}`);
    
    // The file_url exists in Supabase Storage, so let's update filePath to match
    if (plan.file_url) {
      const updates = {
        filePath: plan.file_url, // Use the same path as file_url
        file_name: plan.file_url // Update file_name for consistency
      };
      
      console.log('\n🔧 Updating plan with corrected paths...');
      console.log('Updates:', updates);
      
      const { data: updatedPlan, error: updateError } = await supabase
        .from('plans')
        .update(updates)
        .eq('id', planId)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Error updating plan:', updateError);
        return;
      }
      
      console.log('\n✅ Plan updated successfully!');
      console.log('New data:');
      console.log(`File URL: ${updatedPlan.file_url}`);
      console.log(`File Path: ${updatedPlan.filePath}`);
      console.log(`File Name: ${updatedPlan.file_name}`);
      
    } else {
      console.log('❌ No file_url found, cannot fix paths');
    }
    
  } catch (err) {
    console.error('❌ Script error:', err);
  }
}

fixFilePaths();