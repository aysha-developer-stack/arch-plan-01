import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: 'server/.env' });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

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

async function testServiceRoleSignedUrl() {
  try {
    const fileName = '1758711584496-fhbgn.pdf';
    
    console.log('🔍 Testing signed URL creation with SERVICE ROLE KEY for:', fileName);
    
    // Test: Create signed URL with 1 hour expiry (same as server)
    console.log('\n📝 Creating signed URL with 1 hour expiry...');
    const { data: signedData, error } = await supabase.storage
      .from('plan-files')
      .createSignedUrl(fileName, 60 * 60);
      
    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Success:', signedData.signedUrl);
      
      // Test: Try to fetch the file using the signed URL
      console.log('\n📝 Fetching file using signed URL...');
      try {
        const response = await fetch(signedData.signedUrl);
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const contentLength = response.headers.get('content-length');
          console.log('✅ File fetch successful! Content length:', contentLength);
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

testServiceRoleSignedUrl();