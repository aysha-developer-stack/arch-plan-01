import { supabase } from './db';

async function fixExistingUsersEmail() {
  try {
    console.log('🔍 Checking existing users with unconfirmed emails...');
    
    // Get all users from auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log(`📊 Found ${users.users.length} total users`);
    
    // Filter users with unconfirmed emails
    const unconfirmedUsers = users.users.filter(user => !user.email_confirmed_at);
    
    console.log(`📧 Found ${unconfirmedUsers.length} users with unconfirmed emails`);
    
    if (unconfirmedUsers.length === 0) {
      console.log('✅ All users already have confirmed emails!');
      return;
    }
    
    // Update each unconfirmed user
    for (const user of unconfirmedUsers) {
      console.log(`🔧 Confirming email for user: ${user.email}`);
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );
      
      if (updateError) {
        console.error(`❌ Error confirming email for ${user.email}:`, updateError);
      } else {
        console.log(`✅ Email confirmed for ${user.email}`);
      }
    }
    
    console.log('🎉 Email confirmation fix completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixExistingUsersEmail();