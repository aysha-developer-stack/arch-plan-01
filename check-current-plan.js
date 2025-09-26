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

async function checkCurrentPlan() {
  try {
    const planId = '529010b0-1a20-47af-9594-3c0d23d1cbef';
    
    console.log('Checking current plan data...');
    
    const { data: plan, error } = await supabase
      .from('plans')
      .select('id, title, file_url, filePath, file_name')
      .eq('id', planId)
      .single();
    
    if (error) {
      console.error('Error fetching plan:', error);
      return;
    }
    
    console.log('Current plan data:', {
      id: plan.id,
      title: plan.title,
      file_url: plan.file_url,
      filePath: plan.filePath,
      file_name: plan.file_name
    });
    
    // Check if file_url is still a signed URL
    if (plan.file_url && plan.file_url.startsWith('http')) {
      console.log('\n❌ file_url still contains a signed URL, needs to be fixed');
      
      // Extract filename from the signed URL
      const urlParts = plan.file_url.split('/');
      const objectPath = urlParts.find(part => part.includes('plan-files'));
      if (objectPath) {
        const filename = objectPath.replace('plan-files%2F', '').replace('plan-files/', '');
        console.log('Extracted filename:', filename);
        
        // Update the plan with correct filename
        const { error: updateError } = await supabase
          .from('plans')
          .update({
            file_url: filename,
            filePath: filename,
            file_name: filename
          })
          .eq('id', planId);
        
        if (updateError) {
          console.error('Error updating plan:', updateError);
        } else {
          console.log('✅ Plan updated successfully with filename:', filename);
        }
      }
    } else {
      console.log('✅ file_url looks correct:', plan.file_url);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCurrentPlan();