require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndAddColumns() {
  try {
    // Check if columns exist by querying the information schema
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'plans')
      .in('column_name', ['plotWidthMin', 'plotWidthMax', 'coveredAreaMin', 'coveredAreaMax']);

    if (error) {
      console.error('Error checking columns:', error);
      return;
    }

    const existingColumns = columns.map(col => col.column_name);
    console.log('Existing columns:', existingColumns);

    const columnsToAdd = [
      { name: 'plotWidthMin', exists: existingColumns.includes('plotWidthMin') },
      { name: 'plotWidthMax', exists: existingColumns.includes('plotWidthMax') },
      { name: 'coveredAreaMin', exists: existingColumns.includes('coveredAreaMin') },
      { name: 'coveredAreaMax', exists: existingColumns.includes('coveredAreaMax') }
    ];

    const missingColumns = columnsToAdd.filter(col => !col.exists);
    
    if (missingColumns.length === 0) {
      console.log('All required columns already exist!');
      return;
    }

    console.log('Missing columns:', missingColumns.map(col => col.name));
    console.log('The columns need to be added manually via Supabase dashboard or direct SQL.');
    console.log('Required SQL:');
    missingColumns.forEach(col => {
      console.log(`ALTER TABLE plans ADD COLUMN ${col.name} DECIMAL(10,3);`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAndAddColumns();