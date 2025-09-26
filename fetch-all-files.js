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

async function fetchAllFiles() {
  try {
    console.log('Fetching all plans with files from database...\n');
    
    const { data: plans, error } = await supabase
      .from('plans')
      .select('id, title, file_url, filePath, file_name, created_at')
      .not('file_url', 'is', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching plans:', error);
      return;
    }
    
    if (!plans || plans.length === 0) {
      console.log('No plans with files found in database.');
      return;
    }
    
    console.log(`Found ${plans.length} plans with files:\n`);
    
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. Plan: ${plan.title}`);
      console.log(`   ID: ${plan.id}`);
      console.log(`   File URL: ${plan.file_url}`);
      console.log(`   File Path: ${plan.filePath}`);
      console.log(`   File Name: ${plan.file_name}`);
      console.log(`   Created: ${new Date(plan.created_at).toLocaleString()}`);
      console.log(`   Download URL: http://localhost:5000/api/plans/${plan.id}/download`);
      console.log('');
    });
    
    // Check if any files have signed URLs (which would be incorrect)
    const plansWithSignedUrls = plans.filter(plan => 
      plan.file_url && plan.file_url.startsWith('http')
    );
    
    if (plansWithSignedUrls.length > 0) {
      console.log(`⚠️  Found ${plansWithSignedUrls.length} plans with signed URLs (should be fixed):`);
      plansWithSignedUrls.forEach(plan => {
        console.log(`   - ${plan.title} (${plan.id})`);
      });
    } else {
      console.log('✅ All file URLs look correct (no signed URLs found)');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fetchAllFiles();