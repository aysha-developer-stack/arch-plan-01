import { supabase } from './server/db.ts';

async function debugImageError() {
  const planId = 'ce13e9b5-d630-4084-bce3-e06a5c1f6550';
  const imageId = '1758693638175-762380363';
  
  console.log(`🔍 Debugging 404 error for plan ${planId} and image ${imageId}...`);
  
  try {
    // Get the plan from database
    const { data: plan, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (error) {
      console.error('❌ Error fetching plan:', error);
      return;
    }
    
    if (!plan) {
      console.log('❌ Plan not found in database');
      return;
    }
    
    console.log('✅ Plan found:', plan.title);
    console.log('📋 Plan images array:', JSON.stringify(plan.images, null, 2));
    
    // Check if the specific image is in the images array
    const hasImage = plan.images && plan.images.some(img => 
      img.fileId === imageId || img.path === imageId || img.path.includes(imageId)
    );
    console.log(`🖼️ Image ${imageId} in database:`, hasImage ? '✅ YES' : '❌ NO');
    
    if (plan.images && plan.images.length > 0) {
      console.log('\n📸 All images in database:');
      plan.images.forEach((img, index) => {
        console.log(`  ${index + 1}. FileID: ${img.fileId}, Path: ${img.path}, Filename: ${img.filename}`);
        
        // Check if this image matches our problematic one
        if (img.fileId === imageId) {
          console.log(`    ⚠️  This is the problematic image!`);
          console.log(`    📁 Expected path: ${img.path}`);
        }
      });
    }
    
    // Also check if there are any images with similar timestamps
    if (plan.images && plan.images.length > 0) {
      const timestamp = imageId.split('-')[0]; // Extract timestamp part
      console.log(`\n🕐 Looking for images with timestamp ${timestamp}:`);
      
      const similarImages = plan.images.filter(img => 
        img.fileId && img.fileId.startsWith(timestamp)
      );
      
      if (similarImages.length > 0) {
        console.log('📷 Found similar timestamp images:');
        similarImages.forEach((img, index) => {
          console.log(`  ${index + 1}. FileID: ${img.fileId}, Path: ${img.path}`);
        });
      } else {
        console.log('❌ No images found with similar timestamp');
      }
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

debugImageError();