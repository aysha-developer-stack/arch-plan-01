import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const SERVER_URL = 'http://localhost:5000';

async function testApiUpload() {
  console.log('🧪 Testing API upload with plotLengthMin and plotLengthMax...\n');

  try {
    // Create a simple test PDF file if it doesn't exist
    const testFilePath = path.join(process.cwd(), 'test-plan.pdf');
    if (!fs.existsSync(testFilePath)) {
      // Create a minimal PDF content
      const pdfContent = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n174\n%%EOF';
      fs.writeFileSync(testFilePath, pdfContent);
      console.log('📄 Created test PDF file');
    }

    // Create form data
    const formData = new FormData();
    formData.append('title', 'Test Plan - API Upload');
    formData.append('description', 'Testing plotLengthMin and plotLengthMax via API');
    formData.append('architect', 'Test Architect');
    formData.append('building_type', 'Residential');
    formData.append('plotLengthMin', '25.5');
    formData.append('plotLengthMax', '35.8');
    formData.append('plotWidth', '15.2');
    formData.append('coveredArea', '120.5');
    formData.append('planType', 'Residential');
    formData.append('storeys', '2');
    formData.append('bedrooms', '3');
    
    // Add the PDF file
    formData.append('file', fs.createReadStream(testFilePath));

    console.log('📤 Sending upload request to API...');
    console.log('📋 Form data includes:');
    console.log('   - plotLengthMin: 25.5');
    console.log('   - plotLengthMax: 35.8');
    console.log('   - plotWidth: 15.2');
    console.log('   - coveredArea: 120.5\n');

    // Send the request
    const response = await fetch(`${SERVER_URL}/api/admin/plans`, {
      method: 'POST',
      body: formData,
      headers: {
        // Note: Don't set Content-Type header, let fetch set it with boundary
        ...formData.getHeaders()
      }
    });

    const responseText = await response.text();
    
    if (response.ok) {
      console.log('✅ Upload successful!');
      console.log('📋 Response:', responseText);
      
      // Parse response to get plan ID if available
      try {
        const responseData = JSON.parse(responseText);
        if (responseData.planId) {
          console.log(`📋 Plan ID: ${responseData.planId}`);
        }
      } catch (e) {
        // Response might not be JSON
      }
      
      console.log('\n🔍 Now checking if the values were stored correctly...');
      
      // Wait a moment for the database to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check the latest plan in the database
      const { exec } = await import('child_process');
      exec('node check-plot-length-fields.js', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error checking database:', error);
          return;
        }
        console.log('\n📊 Latest database state:');
        console.log(stdout);
      });
      
    } else {
      console.log('❌ Upload failed!');
      console.log(`📋 Status: ${response.status} ${response.statusText}`);
      console.log('📋 Response:', responseText);
    }

    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('🧹 Cleaned up test PDF file');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testApiUpload();