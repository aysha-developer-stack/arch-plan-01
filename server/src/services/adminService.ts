import { supabasePublic, supabaseAdmin } from '../../db';

/**
 * Creates a new admin user in Supabase
 * @param email Admin email
 * @param password Admin password
 * @param name Admin name
 * @returns The created admin user or an error
 */
export async function createAdmin(email: string, password: string, name: string) {
  try {
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
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
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (adminError) {
      // If the trigger didn't work, create the admin record manually
      const { data: newAdmin, error: createError } = await supabaseAdmin
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
  } catch (error) {
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
export async function authenticateAdmin(email: string, password: string) {
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Admin authentication attempt ${attempt}/${maxRetries} for ${email}`);
      
      // Sign in the user with timeout handling
      const { data: authData, error: authError } = await Promise.race([
        supabasePublic.auth.signInWithPassword({
          email,
          password
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Authentication timeout')), 15000)
        )
      ]) as any;

      if (authError) {
        console.error(`Authentication error on attempt ${attempt}:`, authError);
        
        // If it's a JSON parsing error, retry
        if (authError.message?.includes('Unexpected end of JSON input') && attempt < maxRetries) {
          console.log(`Retrying authentication due to JSON parsing error...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          continue;
        }
        
        throw authError;
      }

      // Skip checking the admins table to avoid recursion
      // Just check if the user has admin metadata
      if (!authData.user.user_metadata?.is_admin) {
        throw new Error('User is not an admin');
      }

      console.log(`Admin authentication successful for ${email}`);
      
      // Return the user data without querying the admins table
      return {
        admin: {
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.user_metadata.name || email
        },
        session: authData.session
      };
    } catch (error: any) {
      lastError = error;
      console.error(`Error authenticating admin on attempt ${attempt}:`, error);
      
      // If it's the last attempt or not a retryable error, throw
      if (attempt === maxRetries || !error.message?.includes('Unexpected end of JSON input')) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw lastError;
}

/**
 * Gets all admins
 * @returns A list of all admins
 */
export async function getAllAdmins() {
  try {
    // Use service role client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting admins:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting admins:', error);
    return [];
  }
}

/**
 * Gets an admin by ID
 * @param id Admin ID
 * @returns The admin or null if not found
 */
export async function getAdminById(id: string) {
  try {
    // Use service role client to bypass RLS
    const { data, error } = await supabaseAdmin
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
  } catch (error) {
    console.error('Error getting admin:', error);
    throw error;
  }
}

/**
 * Deletes an admin
 * @param id Admin ID
 * @returns True if successful, false otherwise
 */
export async function deleteAdmin(id: string) {
  try {
    // Use service role client to bypass RLS
    const { error } = await supabaseAdmin
      .from('admins')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Also delete the user from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) {
      throw authError;
    }

    return true;
  } catch (error) {
    console.error('Error deleting admin:', error);
    return false;
  }
}
