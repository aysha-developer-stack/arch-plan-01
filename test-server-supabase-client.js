import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables exactly like the server does
dotenv.config({ path: path.join(__dirname, 'server/.env') });
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase URL or Service Role Key not set in environment variables.');
  process.exit(1);
}

// Create Supabase client with EXACT same configuration as server
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    }
  },
  db: {
    schema: 'public'
  }
});

async function testServerSupabaseClient() {
  try {
    console.log('Testing with server\'s exact Supabase client configuration...\n');
    
    const fileName = '1758711584496-fhbgn.pdf'; // Big House file
    const BUCKET_NAME = 'plan-files';
    
    console.log(`Testing file: ${fileName}`);
    console.log(`Bucket: ${BUCKET_NAME}`);
    
    // Test the exact same method as SupabaseStorage.getFileUrl
    console.log('Creating signed URL with server configuration...');
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 60 * 60); // 1 hour expiry
    
    if (error) {
      console.log(`❌ Error creating signed URL: ${error.message}`);
      console.log('Error details:', error);
      return;
    }
    
    if (!data || !data.signedUrl) {
      console.log('❌ No data returned from createSignedUrl');
      return;
    }
    
    console.log(`✅ Signed URL created successfully: ${data.signedUrl}`);
    
    // Test the signed URL
    try {
      const response = await fetch(data.signedUrl, { method: 'HEAD' });
      console.log(`✅ Signed URL is accessible: ${response.status} ${response.statusText}`);
    } catch (fetchError) {
      console.log(`❌ Error accessing signed URL: ${fetchError.message}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testServerSupabaseClient();