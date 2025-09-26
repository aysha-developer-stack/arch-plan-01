import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });
dotenv.config({ path: 'server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixFilePathMismatch() {
  console.log('\n=== Fixing File Path Mismatch ===');
  
  // 1. Get all plans from database
  console.log('\n1. Fetching all plans from database...');
  const { data: plans, error: plansError } = await supabase
    .from('plans')
    .select('id, title, filePath, created_at');
    
  if (plansError) {
    console.error('Error fetching plans:', plansError.message);
    return;
  }
  
  console.log(`Found ${plans.length} plans in database`);
  
  // 2. Get all files from storage
  console.log('\n2. Fetching all files from storage...');
  const { data: files, error: filesError } = await supabase.storage
    .from('plan-files')
    .list('', { limit: 1000 });
    
  if (filesError) {
    console.error('Error fetching files:', filesError.message);
    return;
  }
  
  console.log(`Found ${files.length} files in storage`);
  
  // 3. Try to match plans with files based on creation time and file extension
  console.log('\n3. Matching plans with files...');
  
  const updates = [];
  const unmatchedPlans = [];
  
  for (const plan of plans) {
    // Check if current filePath exists in storage
    const currentFileExists = files.find(f => f.name === plan.filePath);
    
    if (currentFileExists) {
      console.log(`✓ Plan ${plan.id} already has correct filePath: ${plan.filePath}`);
      continue;
    }
    
    // Try to find matching file by timestamp proximity and extension
    const planCreatedAt = new Date(plan.created_at);
    const planTimestamp = planCreatedAt.getTime();
    
    // Look for files created around the same time (within 1 hour)
    const timeWindow = 60 * 60 * 1000; // 1 hour in milliseconds
    
    const potentialMatches = files.filter(file => {
      // Extract timestamp from filename (format: timestamp-originalname.ext)
      const timestampMatch = file.name.match(/^(\d+)-/);
      if (!timestampMatch) return false;
      
      const fileTimestamp = parseInt(timestampMatch[1]);
      const timeDiff = Math.abs(planTimestamp - fileTimestamp);
      
      return timeDiff <= timeWindow;
    });
    
    if (potentialMatches.length === 1) {
      // Perfect match - only one file in the time window
      const matchedFile = potentialMatches[0];
      updates.push({
        planId: plan.id,
        oldFilePath: plan.filePath,
        newFilePath: matchedFile.name,
        reason: 'timestamp_match'
      });
      console.log(`📝 Plan ${plan.id}: ${plan.filePath} → ${matchedFile.name} (timestamp match)`);
    } else if (potentialMatches.length > 1) {
      // Multiple matches - try to match by original filename
      const originalFileName = plan.filePath;
      const nameMatch = potentialMatches.find(file => 
        file.name.includes(originalFileName.replace(/\.[^/.]+$/, "")) // Remove extension for comparison
      );
      
      if (nameMatch) {
        updates.push({
          planId: plan.id,
          oldFilePath: plan.filePath,
          newFilePath: nameMatch.name,
          reason: 'name_and_timestamp_match'
        });
        console.log(`📝 Plan ${plan.id}: ${plan.filePath} → ${nameMatch.name} (name + timestamp match)`);
      } else {
        unmatchedPlans.push({
          plan,
          potentialMatches: potentialMatches.map(f => f.name)
        });
        console.log(`❓ Plan ${plan.id}: Multiple potential matches, manual review needed`);
      }
    } else {
      unmatchedPlans.push({
        plan,
        potentialMatches: []
      });
      console.log(`❌ Plan ${plan.id}: No matching file found`);
    }
  }
  
  // 4. Apply updates
  console.log(`\n4. Applying ${updates.length} updates...`);
  
  for (const update of updates) {
    const { error } = await supabase
      .from('plans')
      .update({ filePath: update.newFilePath })
      .eq('id', update.planId);
      
    if (error) {
      console.error(`❌ Failed to update plan ${update.planId}:`, error.message);
    } else {
      console.log(`✅ Updated plan ${update.planId}: ${update.oldFilePath} → ${update.newFilePath}`);
    }
  }
  
  // 5. Report unmatched plans
  if (unmatchedPlans.length > 0) {
    console.log(`\n5. Unmatched plans (${unmatchedPlans.length}):`);
    unmatchedPlans.forEach(({ plan, potentialMatches }) => {
      console.log(`\nPlan ID: ${plan.id}`);
      console.log(`  Title: ${plan.title}`);
      console.log(`  Current filePath: ${plan.filePath}`);
      console.log(`  Created: ${plan.created_at}`);
      if (potentialMatches.length > 0) {
        console.log(`  Potential matches: ${potentialMatches.join(', ')}`);
      } else {
        console.log(`  No potential matches found`);
      }
    });
  }
  
  console.log(`\n✅ File path fix completed!`);
  console.log(`   Updated: ${updates.length} plans`);
  console.log(`   Unmatched: ${unmatchedPlans.length} plans`);
}

fixFilePathMismatch().catch(console.error);