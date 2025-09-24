import { supabase } from './server/db.ts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixSpecificPlan() {
  try {
    const planId = '529010b0-1a20-47af-9594-3c0d23d1cbef'; // Big House
    const correctFilename = '1758711584496-fhbgn.pdf';
    
    console.log('Fixing specific plan in database...\n');
    
    // First, check current state
    const { data: currentPlan, error: fetchError } = await supabase
      .from('plans')
      .select('id, title, file_url, filePath, file_name')
      .eq('id', planId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching plan:', fetchError);
      return;
    }
    
    console.log('Current plan data:');
    console.log('file_url:', currentPlan.file_url);
    console.log('filePath:', currentPlan.filePath);
    console.log('file_name:', currentPlan.file_name);
    
    // Update the plan with correct filename
    const { data: updatedPlan, error: updateError } = await supabase
      .from('plans')
      .update({
        file_url: correctFilename,
        filePath: correctFilename,
        file_name: correctFilename
      })
      .eq('id', planId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating plan:', updateError);
      return;
    }
    
    console.log('\n✅ Plan updated successfully:');
    console.log('New file_url:', updatedPlan.file_url);
    console.log('New filePath:', updatedPlan.filePath);
    console.log('New file_name:', updatedPlan.file_name);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixSpecificPlan();