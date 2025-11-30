import dotenv from 'dotenv';
import { supabase } from './db';
// Load environment variables from parent directory
dotenv.config({ path: '../.env' });
async function createAdminUser() {
    try {
        console.log('🔗 Creating admin user with specific ID...');
        const email = "archplan.vivid@gmail.com";
        const password = "Vividarch4321$$";
        const name = "ArchPlan Admin";
        const adminId = "829aa91c-5eef-4465-bbaa-bb32b2c2240c";
        console.log('📧 Email:', email);
        console.log('👤 Name:', name);
        console.log('🆔 Target ID:', adminId);
        // First, try to create the auth user with the specific ID
        console.log('\n1️⃣ Creating auth user...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    is_admin: true
                }
            }
        });
        if (signUpError) {
            if (signUpError.message.includes('already registered')) {
                console.log('👤 User already exists, trying to sign in...');
                // Try to sign in to get the user ID
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (signInError) {
                    console.log('❌ Sign in failed:', signInError.message);
                    console.log('💡 The user might exist but with a different password');
                    return;
                }
                console.log('✅ Successfully signed in!');
                console.log('🆔 Current User ID:', signInData.user.id);
                if (signInData.user.id === adminId) {
                    console.log('🎉 User ID matches the target admin ID!');
                }
                else {
                    console.log('⚠️ User ID does not match target admin ID');
                    console.log('💡 You may need to update the admin record in the database');
                }
            }
            else {
                throw signUpError;
            }
        }
        else {
            console.log('✅ User created successfully!');
            console.log('🆔 New User ID:', signUpData.user?.id);
            if (signUpData.user?.id === adminId) {
                console.log('🎉 User ID matches the target admin ID!');
            }
            else {
                console.log('⚠️ User ID does not match target admin ID');
                console.log('💡 You may need to update the admin record in the database');
                console.log('🔄 New admin record should use ID:', signUpData.user?.id);
            }
        }
        console.log('\n2️⃣ Checking admin record in database...');
        // Check if admin record exists
        const { data: adminCheck, error: adminCheckError } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email);
        if (adminCheckError) {
            console.log('❌ Error checking admin record:', adminCheckError.message);
        }
        else if (adminCheck && adminCheck.length > 0) {
            console.log('✅ Admin record found in database!');
            console.log('📊 Admin records:', adminCheck);
        }
        else {
            console.log('❌ No admin record found in database, creating one now...');
            const { data: newAdmin, error: createError } = await supabase
                .from('admins')
                .insert({
                id: adminId,
                email,
                name
            })
                .select();
            if (createError) {
                console.log('❌ Error creating admin record:', createError.message);
            }
            else {
                console.log('✅ Admin record created successfully!', newAdmin);
            }
        }
        console.log('\n🌐 You can try to login at: http://localhost:5000/admin/login');
        console.log('🔑 Password:', password);
    }
    catch (error) {
        console.error('❌ Error creating admin user:', error.message || error);
        console.error('Full error:', error);
    }
}
createAdminUser();
//# sourceMappingURL=create-admin.js.map