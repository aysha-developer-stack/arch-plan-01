import { supabase } from '../../db';
/**
 * Creates a new admin user in Supabase
 * @param email Admin email
 * @param password Admin password
 * @param name Admin name
 * @returns The created admin user or an error
 */
export async function createAdmin(email, password, name) {
    try {
        // Create the user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm the email
            user_metadata: {
                name,
                is_admin: true
            }
        });
        if (authError) {
            throw authError;
        }
        // The trigger function should automatically create the admin record
        // But we'll check to make sure it exists
        const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('id', authData.user.id)
            .single();
        if (adminError) {
            // If the trigger didn't work, create the admin record manually
            const { data: newAdmin, error: createError } = await supabase
                .from('admins')
                .insert({
                id: authData.user.id,
                email: authData.user.email,
                name
            })
                .select()
                .single();
            if (createError) {
                throw createError;
            }
            return newAdmin;
        }
        return adminData;
    }
    catch (error) {
        console.error('Error creating admin:', error);
        throw error;
    }
}
/**
 * Authenticates an admin user
 * @param email Admin email
 * @param password Admin password
 * @returns The authenticated admin user or an error
 */
export async function authenticateAdmin(email, password) {
    try {
        // Sign in the user
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (authError) {
            throw authError;
        }
        // Skip checking the admins table to avoid recursion
        // Just check if the user has admin metadata
        if (!authData.user.user_metadata?.is_admin) {
            throw new Error('User is not an admin');
        }
        // Return the user data without querying the admins table
        return {
            admin: {
                id: authData.user.id,
                email: authData.user.email,
                name: authData.user.user_metadata.name || email
            },
            session: authData.session
        };
    }
    catch (error) {
        console.error('Error authenticating admin:', error);
        throw error;
    }
}
/**
 * Gets all admins
 * @returns A list of all admins
 */
export async function getAllAdmins() {
    try {
        // Use service role client to bypass RLS
        const { data, error } = await supabase
            .from('admins')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error getting admins:', error);
            return [];
        }
        return data || [];
    }
    catch (error) {
        console.error('Error getting admins:', error);
        return [];
    }
}
/**
 * Gets an admin by ID
 * @param id Admin ID
 * @returns The admin or null if not found
 */
export async function getAdminById(id) {
    try {
        // Use service role client to bypass RLS
        const { data, error } = await supabase
            .from('admins')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                // Record not found
                return null;
            }
            throw error;
        }
        return data;
    }
    catch (error) {
        console.error('Error getting admin:', error);
        throw error;
    }
}
/**
 * Deletes an admin
 * @param id Admin ID
 * @returns True if successful, false otherwise
 */
export async function deleteAdmin(id) {
    try {
        // Use service role client to bypass RLS
        const { error } = await supabase
            .from('admins')
            .delete()
            .eq('id', id);
        if (error) {
            throw error;
        }
        // Also delete the user from Supabase Auth
        const { error: authError } = await supabase.auth.admin.deleteUser(id);
        if (authError) {
            throw authError;
        }
        return true;
    }
    catch (error) {
        console.error('Error deleting admin:', error);
        return false;
    }
}
//# sourceMappingURL=adminService.js.map