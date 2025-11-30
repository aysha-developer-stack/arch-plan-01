import { supabase } from './db.ts';

async function checkSchema() {
  try {
    console.log('🔍 Checking plans table schema...');
    
    // Use raw SQL query instead of PostgREST
    const { data, error } = await supabase.rpc('exec', {
      sql: `
        SELECT column_name, is_nullable, data_type, column_default
        FROM information_schema.columns 
        WHERE table_name = 'plans' 
          AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });
    
    if (error) {
      console.error('❌ Error checking schema:', error);
      
      // Try alternative approach - just test a simple insert
      console.log('\n🧪 Testing with a minimal plan insert...');
      const testResult = await supabase
         .from('plans')
         .insert({
           title: 'Test Plan',
           description: 'Test Description',
           architect: 'Test Architect', // Add required field
           fileName: 'test.pdf',
           filePath: '/test/path',
           fileSize: 1000,
           planType: 'Residential',
           building_type: 'Residential',
           storeys: 1
         })
         .select()
         .limit(0);
      
      if (testResult.error) {
        console.error('❌ Insert test failed:', testResult.error);
        
        // Parse the error to understand what fields are missing
        if (testResult.error.message.includes('null value in column')) {
          const match = testResult.error.message.match(/null value in column "([^"]+)"/);
          if (match) {
            console.log(`\n🚨 Missing required field: ${match[1]}`);
          }
        }
      } else {
        console.log('✅ Insert structure test passed');
      }
      return;
    }
    
    console.log('\n📋 Plans table columns:');
    console.table(data);
    
    // Check for required fields
    const requiredFields = data.filter(col => col.is_nullable === 'NO' && !col.column_default);
    console.log('\n🚨 Required fields (NOT NULL without default):');
    requiredFields.forEach(field => {
      console.log(`  - ${field.column_name} (${field.data_type})`);
    });
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkSchema();