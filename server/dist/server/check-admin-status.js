import dotenv from 'dotenv';
import { supabase } from './db';
// Load environment variables from parent directory
dotenv.config({ path: '../.env' });
async function checkAdminStatus() {
    try {
        console.log('🔍 Checking admin user status...');
        const adminEmail = 'archplan.vivid@gmail.com';
        const adminPassword = 'Vividarch4321$$';
        // Try to sign in to see if the user exists
        console.log('\n1️⃣ Attempting to sign in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: adminEmail,
            password: adminPassword
        });
        if (signInError) {
            console.error('❌ Sign in failed:', signInError.message);
            console.log('\n💡 This could mean:');
            console.log('   - The user doesn\'t exist');
            console.log('   - The password is incorrect');
            console.log('   - The user exists but isn\'t confirmed');
            return;
        }
        console.log('✅ User exists and can sign in');
        console.log('👤 User ID:', signInData.user.id);
        console.log('📧 Email:', signInData.user.email);
        // Check if admin record exists
        console.log('\n2️⃣ Checking admin record...');
        const { data: adminRecord, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('id', signInData.user.id)
            .single();
        if (adminError) {
            if (adminError.code === 'PGRST116') {
                console.log('❌ No admin record found');
                console.log('\n📝 To fix this, you need to manually add the admin record:');
                console.log('   1. Go to your Supabase dashboard');
                console.log('   2. Navigate to Table Editor > admins');
                console.log('   3. Insert a new row with:');
                console.log(`      - id: ${signInData.user.id}`);
                console.log(`      - email: ${adminEmail}`);
                console.log('      - name: ArchPlan Admin');
                console.log('   4. Save the record');
                console.log('\n🔗 Or run this SQL in the SQL Editor:');
                console.log(`INSERT INTO admins (id, email, name) VALUES ('${signInData.user.id}', '${adminEmail}', 'ArchPlan Admin');`);
            }
            else {
                console.error('❌ Error checking admin record:', adminError);
            }
            return;
        }
        console.log('✅ Admin record exists!');
        console.log('📊 Admin details:', adminRecord);
        console.log('\n🎉 Everything is set up correctly!');
        console.log('🌐 You can now login at: http://localhost:5000/admin/login');
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Password:', adminPassword);
        // Sign out
        await supabase.auth.signOut();
    }
    catch (error) {
        console.error('❌ Unexpected error:', error.message || error);
    }
}
checkAdminStatus();
//# sourceMappingURL=check-admin-status.js.map