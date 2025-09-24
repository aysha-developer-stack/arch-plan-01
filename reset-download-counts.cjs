const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetDownloadCounts() {
  try {
    console.log('🔄 Resetting all download counts to 0...');
    
    // Update all plans to set download_count to 0
    const { data, error } = await supabase
      .from('plans')
      .update({ download_count: 0 })
      .gt('id', '00000000-0000-0000-0000-000000000000'); // This will match all rows
    
    if (error) {
      console.error('❌ Error resetting download counts:', error);
      return;
    }
    
    console.log('✅ Successfully reset all download counts to 0');
    
    // Verify the reset by checking total downloads
    const { data: stats, error: statsError } = await supabase
      .rpc('get_plan_stats');
    
    if (statsError) {
      console.error('❌ Error fetching stats:', statsError);
      return;
    }
    
    console.log('📊 Current statistics after reset:');
    console.log('   Total Downloads:', stats.total_downloads || 0);
    console.log('   Total Plans:', stats.total_plans || 0);
    console.log('   Recent Uploads:', stats.recent_uploads || 0);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the reset
resetDownloadCounts();