import { supabase } from './db';
import { authenticateAdmin } from './src/services/adminService';
async function testSpecificAdmin() {
    console.log('🔍 Testing specific admin ID: 829aa91c-5eef-4465-bbaa-bb32b2c2240c\n');
    try {
        // Test 1: Check if admin record exists in database
        console.log('1️⃣ Checking admin record in database...');
        const { data: adminRecord, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('id', '829aa91c-5eef-4465-bbaa-bb32b2c2240c')
            .single();
        if (adminError) {
            console.log('❌ Admin record not found:', adminError.message);
        }
        else {
            console.log('✅ Admin record found!');
            console.log('📧 Email:', adminRecord.email);
            console.log('👤 Name:', adminRecord.name);
            console.log('🕒 Created:', adminRecord.created_at);
        }
        console.log('');
        // Test 2: Check if user exists in auth
        console.log('2️⃣ Checking user in Supabase Auth...');
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById('829aa91c-5eef-4465-bbaa-bb32b2c2240c');
        if (authError) {
            console.log('❌ Auth user not found:', authError.message);
        }
        else {
            console.log('✅ Auth user found!');
            console.log('📧 Email:', authUser.user.email);
            console.log('🆔 ID:', authUser.user.id);
            console.log('📱 Phone:', authUser.user.phone || 'Not set');
            console.log('✅ Email confirmed:', authUser.user.email_confirmed_at ? 'Yes' : 'No');
        }
        console.log('');
        // Test 3: Try to authenticate with known credentials
        console.log('3️⃣ Testing authentication with Vividarch4321$$...');
        try {
            const authResult = await authenticateAdmin('archplan.vivid@gmail.com', 'Vividarch4321$$');
            console.log('✅ Authentication successful!');
            console.log('👤 Admin:', authResult.admin);
        }
        catch (authErr) {
            console.log('❌ Authentication failed:', authErr.message);
            // Test with alternative password
            console.log('🔄 Trying alternative password: ArchPlan2024!...');
            try {
                const authResult2 = await authenticateAdmin('archplan.vivid@gmail.com', 'ArchPlan2024!');
                console.log('✅ Authentication successful with alternative password!');
                console.log('👤 Admin:', authResult2.admin);
            }
            catch (authErr2) {
                console.log('❌ Authentication failed with alternative password:', authErr2.message);
            }
        }
    }
    catch (error) {
        console.error('❌ Error during testing:', error);
    }
}
testSpecificAdmin();
//# sourceMappingURL=test-specific-admin.js.map