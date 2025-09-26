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

async function fixAllFileUrls() {
  try {
    console.log('Checking and fixing all file URLs in database...\n');
    
    // Get all plans with files
    const { data: plans, error } = await supabase
      .from('plans')
      .select('id, title, file_url, filePath, file_name')
      .not('file_url', 'is', null);
    
    if (error) {
      console.error('Error fetching plans:', error);
      return;
    }
    
    console.log(`Found ${plans.length} plans with files\n`);
    
    let fixedCount = 0;
    
    for (const plan of plans) {
      console.log(`Checking plan: ${plan.title} (${plan.id})`);
      console.log(`Current file_url: ${plan.file_url}`);
      
      // Check if file_url is a signed URL (starts with http)
      if (plan.file_url && plan.file_url.startsWith('http')) {
        console.log('❌ Found signed URL, extracting filename...');
        
        // Extract filename from the signed URL
        let filename = '';
        
        // Try different URL patterns
        if (plan.file_url.includes('/plan-files/')) {
          const parts = plan.file_url.split('/plan-files/')[1];
          filename = parts.split('?')[0]; // Remove query parameters
        } else if (plan.file_url.includes('plan-files%2F')) {
          const parts = plan.file_url.split('plan-files%2F')[1];
          filename = decodeURIComponent(parts.split('?')[0]); // Decode and remove query parameters
        }
        
        if (filename) {
          console.log(`Extracted filename: ${filename}`);
          
          // Update the plan with correct filename
          const { error: updateError } = await supabase
            .from('plans')
            .update({
              file_url: filename,
              filePath: filename,
              file_name: filename
            })
            .eq('id', plan.id);
          
          if (updateError) {
            console.error(`❌ Error updating plan ${plan.id}:`, updateError);
          } else {
            console.log(`✅ Updated plan ${plan.id} with filename: ${filename}`);
            fixedCount++;
          }
        } else {
          console.log('❌ Could not extract filename from URL');
        }
      } else {
        console.log('✅ File URL looks correct (already a filename)');
      }
      
      console.log('');
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} plans with incorrect file URLs`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixAllFileUrls();