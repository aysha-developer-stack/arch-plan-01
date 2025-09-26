import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: 'server/.env' });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignedUrl() {
  try {
    const fileName = '1758711584496-fhbgn.pdf';
    
    console.log('🔍 Testing signed URL creation for:', fileName);
    
    // Test 1: Create signed URL with 1 hour expiry
    console.log('\n📝 Test 1: Creating signed URL with 1 hour expiry...');
    const { data: signedData1, error: error1 } = await supabase.storage
      .from('plan-files')
      .createSignedUrl(fileName, 60 * 60);
      
    if (error1) {
      console.error('❌ Error 1:', error1);
    } else {
      console.log('✅ Success 1:', signedData1.signedUrl);
    }
    
    // Test 2: Create signed URL with 1 minute expiry
    console.log('\n📝 Test 2: Creating signed URL with 1 minute expiry...');
    const { data: signedData2, error: error2 } = await supabase.storage
      .from('plan-files')
      .createSignedUrl(fileName, 60);
      
    if (error2) {
      console.error('❌ Error 2:', error2);
    } else {
      console.log('✅ Success 2:', signedData2.signedUrl);
      
      // Test 3: Try to fetch the file using the signed URL
      console.log('\n📝 Test 3: Fetching file using signed URL...');
      try {
        const response = await fetch(signedData2.signedUrl);
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
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

testSignedUrl();