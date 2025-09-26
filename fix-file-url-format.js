import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'server/.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase URL or Service Role Key not set in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixFileUrlFormat() {
  try {
    const planId = '529010b0-1a20-47af-9594-3c0d23d1cbef';
    
    console.log('🔧 Fixing file_url format for plan:', planId);
    
    // Get the current plan data
    const { data: plan, error: fetchError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();
      
    if (fetchError) {
      console.error('❌ Error fetching plan:', fetchError);
      return;
    }
    
    console.log('\n📋 Current plan data:');
    console.log('Title:', plan.title);
    console.log('File URL:', plan.file_url);
    console.log('File Path:', plan.filePath);
    console.log('File Name:', plan.file_name);
    
    // Extract the filename from the signed URL
    let filename = plan.filePath; // Use filePath as it contains the correct filename
    
    if (!filename && plan.file_url) {
      // If filePath is empty, try to extract from file_url
      const urlMatch = plan.file_url.match(/plan-files\/([^?]+)/);
      if (urlMatch) {
        filename = urlMatch[1];
      }
    }
    
    if (!filename) {
      console.error('❌ Could not determine filename');
      return;
    }
    
    console.log('\n🔧 Updating plan with corrected file_url...');
    console.log('New file_url (filename only):', filename);
    
    // Update the plan with the correct file_url format
    const { data: updatedPlan, error: updateError } = await supabase
      .from('plans')
      .update({
        file_url: filename, // Store just the filename, not a signed URL
        filePath: filename, // Keep filePath consistent
        file_name: filename // Update file_name too
      })
      .eq('id', planId)
      .select()
      .single();
      
    if (updateError) {
      console.error('❌ Error updating plan:', updateError);
      return;
    }
    
    console.log('\n✅ Plan updated successfully!');
    console.log('New data:');
    console.log('File URL:', updatedPlan.file_url);
    console.log('File Path:', updatedPlan.filePath);
    console.log('File Name:', updatedPlan.file_name);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixFileUrlFormat();