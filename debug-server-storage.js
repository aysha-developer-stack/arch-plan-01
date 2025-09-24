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

// Create client exactly like the server does
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

async function debugServerStorage() {
  try {
    const fileName = '1758711584496-fhbgn.pdf';
    const BUCKET_NAME = 'plan-files';
    
    console.log('🔍 Testing with EXACT server configuration...\n');
    console.log('Environment variables:');
    console.log('- SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');
    console.log('- Bucket name:', BUCKET_NAME);
    console.log('- File name:', fileName);
    
    // Test 1: List buckets
    console.log('\n📝 Test 1: Listing buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
    } else {
      console.log('✅ Buckets:', buckets.map(b => b.name));
      const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
      console.log(`✅ Bucket '${BUCKET_NAME}' exists:`, bucketExists);
    }
    
    // Test 2: List files in bucket
    console.log('\n📝 Test 2: Listing files in bucket...');
    const { data: files, error: filesError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 10 });
    if (filesError) {
      console.error('❌ Error listing files:', filesError);
    } else {
      console.log('✅ Files found:', files.length);
      const targetFile = files.find(f => f.name === fileName);
      console.log(`✅ Target file '${fileName}' found:`, !!targetFile);
      if (targetFile) {
        console.log('File details:', targetFile);
      }
    }
    
    // Test 3: Create signed URL
    console.log('\n📝 Test 3: Creating signed URL...');
    const { data: signedData, error: signedError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 60 * 60);
      
    if (signedError) {
      console.error('❌ Error creating signed URL:', signedError);
      console.error('Error details:', {
        message: signedError.message,
        status: signedError.status,
        statusCode: signedError.statusCode,
        __isStorageError: signedError.__isStorageError
      });
    } else {
      console.log('✅ Signed URL created:', signedData.signedUrl);
      
      // Test 4: Fetch file
      console.log('\n📝 Test 4: Fetching file...');
      try {
        const response = await fetch(signedData.signedUrl);
        console.log('Response status:', response.status);
        if (response.ok) {
          console.log('✅ File fetch successful!');
        } else {
          console.log('❌ File fetch failed:', response.statusText);
        }
      } catch (fetchError) {
        console.error('❌ Fetch error:', fetchError);
      }
    }
    
  } catch (error) {
    console.error('❌ General error:', error);
  }
}

debugServerStorage();