import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase URL or Anon Key not set in environment variables.');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);
async function testSupabaseConnection() {
    console.log('🔍 Testing Supabase connection...');
    try {
        const { data, error } = await supabase.from('app_users').select('count').limit(1);
        if (error) {
            throw error;
        }
        console.log('✅ Supabase connection successful!');
        return true;
    }
    catch (error) {
        console.error('❌ Supabase connection failed:', error);
        return false;
    }
}
async function testUserAuthentication() {
    console.log('🔍 Testing user authentication...');
    try {
        // This is a test email and password, replace with your own test credentials
        const email = 'test@example.com';
        const password = 'password123';
        // Sign up a test user
        console.log('📝 Signing up test user...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: 'Test User'
                }
            }
        });
        if (signUpError) {
            throw signUpError;
        }
        console.log('✅ User signup successful!');
        // Sign in the test user
        console.log('🔑 Signing in test user...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (signInError) {
            throw signInError;
        }
        console.log('✅ User login successful!');
        // Sign out the test user
        console.log('🚪 Signing out test user...');
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
            throw signOutError;
        }
        console.log('✅ User logout successful!');
        return true;
    }
    catch (error) {
        console.error('❌ User authentication test failed:', error);
        return false;
    }
}
async function testUserManagement() {
    console.log('🔍 Testing user management...');
    try {
        // Get all users
        console.log('👥 Getting all users...');
        const { data: users, error: usersError } = await supabase
            .from('app_users')
            .select('*')
            .limit(10);
        if (usersError) {
            throw usersError;
        }
        console.log(`✅ Found ${users.length} users!`);
        // Get user stats
        console.log('📊 Getting user stats...');
        const { data: stats, error: statsError } = await supabase.rpc('get_user_stats');
        if (statsError) {
            throw statsError;
        }
        console.log('✅ User stats retrieved successfully!');
        console.log(stats);
        return true;
    }
    catch (error) {
        console.error('❌ User management test failed:', error);
        return false;
    }
}
async function runTests() {
    console.log('🧪 Starting Supabase API tests...');
    const connectionSuccess = await testSupabaseConnection();
    if (!connectionSuccess) {
        console.error('❌ Supabase connection failed. Aborting tests.');
        process.exit(1);
    }
    await testUserAuthentication();
    await testUserManagement();
    console.log('🎉 All tests completed!');
}
runTests().catch(error => {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
});
//# sourceMappingURL=test-supabase.js.map