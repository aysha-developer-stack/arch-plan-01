
import { supabase } from './server/db';

async function inspectPlanColumns() {
  try {
    console.log('Fetching a single plan to inspect columns...');
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching plan:', error);
      return;
    }

    if (data) {
      console.log('Plan columns:', Object.keys(data));
      console.log('Sample data for council related fields:');
      // Check for likely council area column names
      const potentialMatches = Object.keys(data).filter(key => 
        key.toLowerCase().includes('council') || 
        key.toLowerCase().includes('area')
      );
      
      potentialMatches.forEach(key => {
        console.log(`${key}: ${data[key]}`);
      });
    } else {
      console.log('No plans found in the database.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

inspectPlanColumns();
