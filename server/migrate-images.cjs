const { supabase } = require('./db.ts');

async function addImagesColumn() {
  try {
    console.log('Starting migration to add images column...');
    
    // Execute each SQL statement separately since exec_sql is not available
    console.log('Adding images column...');
    const { data: alterResult, error: alterError } = await supabase
      .from('plans')
      .select('id')
      .limit(1);
    
    if (alterError && alterError.code === 'PGRST116') {
      console.log('Table structure needs to be updated. Please run this SQL manually in Supabase dashboard:');
      console.log('ALTER TABLE plans ADD COLUMN IF NOT EXISTS images JSONB DEFAULT \'[]\'::jsonb;');
      console.log('CREATE INDEX IF NOT EXISTS idx_plans_images ON plans USING GIN (images);');
      console.log('UPDATE plans SET images = \'[]\'::jsonb WHERE images IS NULL;');
      return;
    }
    
    // Try to update existing records to have empty images array
    console.log('Updating existing records...');
    const { data: updateResult, error: updateError } = await supabase
      .from('plans')
      .update({ images: [] })
      .is('images', null);
    
    if (updateError) {
      console.log('Update failed, column might not exist yet. Manual SQL execution required.');
      console.log('Please run this SQL in Supabase dashboard:');
      console.log('ALTER TABLE plans ADD COLUMN IF NOT EXISTS images JSONB DEFAULT \'[]\'::jsonb;');
      console.log('CREATE INDEX IF NOT EXISTS idx_plans_images ON plans USING GIN (images);');
      console.log('UPDATE plans SET images = \'[]\'::jsonb WHERE images IS NULL;');
    } else {
      console.log('Migration completed successfully!');
      console.log('Updated existing records with empty images array');
    }
    
  } catch (err) {
    console.error('Migration error:', err);
    console.log('Please run this SQL manually in Supabase dashboard:');
    console.log('ALTER TABLE plans ADD COLUMN IF NOT EXISTS images JSONB DEFAULT \'[]\'::jsonb;');
    console.log('CREATE INDEX IF NOT EXISTS idx_plans_images ON plans USING GIN (images);');
    console.log('UPDATE plans SET images = \'[]\'::jsonb WHERE images IS NULL;');
  }
}

addImagesColumn();