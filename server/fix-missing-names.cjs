const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixMissingNames() {
  try {
    // First, get all users with missing or empty names
    const { data: users, error } = await supabase
      .from('app_users')
      .select('id, email, name')
      .or('name.is.null,name.eq.,name.eq.User');
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log(`Found ${users.length} users with missing names:`);
    
    for (const user of users) {
      console.log(`\nFixing user: ${user.email}`);
      
      // Extract name from email (before @)
      const emailName = user.email.split('@')[0];
      // Convert to a more readable format (capitalize first letter)
      const defaultName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      
      // Update the user's name
      const { error: updateError } = await supabase
        .from('app_users')
        .update({ name: defaultName })
        .eq('id', user.id);
      
      if (updateError) {
        console.error(`Error updating user ${user.email}:`, updateError);
      } else {
        console.log(`✅ Updated ${user.email} with name: "${defaultName}"`);
      }
    }
    
    console.log('\n✅ Finished fixing missing names');
  } catch (err) {
    console.error('Script error:', err);
  }
}

fixMissingNames();