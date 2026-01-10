
import { supabase } from './server/db';

async function testSearch() {
  const councilArea = 'Surf Coast Shire Council';
  
  console.log(`Testing search for councilArea: "${councilArea}"`);

  // 1. Direct query with eq
  const { data: dataEq, error: errorEq, count: countEq } = await supabase
    .from('plans')
    .select('*', { count: 'exact' })
    .eq('councilArea', councilArea);

  if (errorEq) {
    console.error('Error with eq:', errorEq);
  } else {
    console.log(`Found ${countEq} plans with eq '${councilArea}'`);
  }

  // 2. Query with ilike (case insensitive)
  const { data: dataIlike, error: errorIlike, count: countIlike } = await supabase
    .from('plans')
    .select('*', { count: 'exact' })
    .ilike('councilArea', councilArea);
    
  if (errorIlike) {
    console.error('Error with ilike:', errorIlike);
  } else {
    console.log(`Found ${countIlike} plans with ilike '${councilArea}'`);
  }
  
  // 3. Check what values exist in the DB for councilArea and their counts
  const { data: allPlans, error: allError } = await supabase
    .from('plans')
    .select('councilArea');
    
  if (allError) {
    console.error('Error fetching all plans:', allError);
  } else {
    console.log('Council Area Counts:');
    const counts: Record<string, number> = {};
    allPlans.forEach((p: any) => {
      const area = p.councilArea || 'Unknown';
      counts[area] = (counts[area] || 0) + 1;
    });
    
    Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([area, count]) => {
      console.log(`"${area}": ${count}`);
    });
  }
}

testSearch();
