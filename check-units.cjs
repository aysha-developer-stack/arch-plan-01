const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'your-anon-key'
);

async function checkUnits() {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('id, title, numberOfUnits')
      .not('numberOfUnits', 'is', null)
      .order('numberOfUnits', { ascending: true })
      .limit(10);
    
    if (error) {
      console.log('Error:', error.message);
      return;
    }
    
    console.log('Plans with numberOfUnits values:');
    data.forEach(plan => {
      console.log(`- ${plan.title}: ${plan.numberOfUnits} units`);
    });
    
    // Get range of values
    const units = data.map(p => p.numberOfUnits).filter(u => u !== null);
    if (units.length > 0) {
      console.log(`\nRange: ${Math.min(...units)} to ${Math.max(...units)} units`);
    } else {
      console.log('\nNo plans found with numberOfUnits values');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }
}

checkUnits();