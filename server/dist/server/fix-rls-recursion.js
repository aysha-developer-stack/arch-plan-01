import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
// Load environment variables
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase URL or Key not found in environment variables');
    process.exit(1);
}
// Create Supabase client with service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
async function fixRLSRecursion() {
    try {
        console.log('🔧 Fixing RLS recursion issue...');
        // Read the SQL file
        const sqlFilePath = path.join(__dirname, 'temp-disable-rls.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        // Execute the SQL
        const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
        if (error) {
            console.error('❌ Error executing SQL:', error);
            return;
        }
        console.log('✅ RLS policies fixed successfully!');
        console.log('🔑 You should now be able to log in as admin.');
    }
    catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}
fixRLSRecursion();
//# sourceMappingURL=fix-rls-recursion.js.map