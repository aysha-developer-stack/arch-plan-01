const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function addTestPlans() {
  try {
    console.log('Adding test plans with different numberOfUnits values...');
    
    const testPlans = [
      {
        title: 'Test Plan - 2 Units',
        description: 'Test plan with 2 units for range filtering',
        architect: 'Test Architect',
        numberOfUnits: 2,
        planType: 'Residential',
        storeys: 1,
        bedrooms: 2,
        building_type: 'Residential',
        file_url: 'test-2-units.pdf',
        status: 'active'
      },
      {
        title: 'Test Plan - 3 Units',
        description: 'Test plan with 3 units for range filtering',
        architect: 'Test Architect',
        numberOfUnits: 3,
        planType: 'Residential',
        storeys: 2,
        bedrooms: 3,
        building_type: 'Residential',
        file_url: 'test-3-units.pdf',
        status: 'active'
      },
      {
        title: 'Test Plan - 5 Units',
        description: 'Test plan with 5 units for range filtering',
        architect: 'Test Architect',
        numberOfUnits: 5,
        planType: 'Residential',
        storeys: 2,
        bedrooms: 4,
        building_type: 'Residential',
        file_url: 'test-5-units.pdf',
        status: 'active'
      }
    ];

    for (const plan of testPlans) {
      const { data, error } = await supabase
        .from('plans')
        .insert([plan])
        .select()
        .single();

      if (error) {
        console.error(`Error adding ${plan.title}:`, error.message);
      } else {
        console.log(`✅ Added: ${plan.title} (${plan.numberOfUnits} units)`);
      }
    }

    console.log('\nTest plans added successfully!');
    console.log('Now you can test the range filter with:');
    console.log('- Min: 1, Max: 2 (should show 1-unit and 2-unit plans)');
    console.log('- Min: 3, Max: 5 (should show 3-unit and 5-unit plans)');
    console.log('- Min: 2, Max: 3 (should show 2-unit and 3-unit plans)');
    console.log('- Min: 4 (should show only 5-unit plan)');
    console.log('- Max: 2 (should show 1-unit and 2-unit plans)');

  } catch (err) {
    console.error('Error:', err.message);
  }
}

addTestPlans();