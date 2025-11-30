import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
// Check if Supabase credentials are set
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase URL or Anon Key not set in environment variables.');
    console.log('Please update your .env file with the following variables:');
    console.log('SUPABASE_URL=https://your-supabase-project-url.supabase.co');
    console.log('SUPABASE_ANON_KEY=your-supabase-anon-key');
    process.exit(1);
}
console.log('✅ Supabase credentials found in environment variables.');
console.log(`SUPABASE_URL: ${supabaseUrl.substring(0, 8)}...`);
console.log(`SUPABASE_ANON_KEY: ${supabaseAnonKey.substring(0, 5)}...`);
// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Test Supabase connection
async function testConnection() {
    try {
        console.log('🔄 Testing Supabase connection...');
        // Try to get the Supabase service status
        const { data, error } = await supabase.from('_service_status').select('*').limit(1);
        if (error) {
            // If the _service_status table doesn't exist, try listing buckets instead
            const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
            if (bucketsError) {
                throw bucketsError;
            }
            console.log('✅ Supabase connection successful!');
            console.log(`Found ${buckets.length} storage buckets.`);
            buckets.forEach(bucket => {
                console.log(`- ${bucket.name}`);
            });
        }
        else {
            console.log('✅ Supabase connection successful!');
            console.log('Service status:', data);
        }
    }
    catch (error) {
        console.error('❌ Supabase connection failed:', error);
        process.exit(1);
    }
}
// Run the test
testConnection();
//# sourceMappingURL=test-env-supabase.js.map