import dotenv from 'dotenv';
import { supabase } from './db';

// Load environment variables from parent directory
dotenv.config({ path: '../.env' });

async function fixAdminRecord() {
  try {
    console.log('🔧 Fixing admin record...');
    
    const email = "archplan.vivid@gmail.com";
    const password = "Vividarch4321$$";
    const oldAdminId = "829aa91c-5eef-4465-bbaa-bb32b2c2240c";
    const newUserId = "c0e7c39e-8ed3-408e-8c22-b0c631aeafa3";
    
    console.log('📧 Email:', email);
    console.log('🆔 Old Admin ID:', oldAdminId);
    console.log('🆔 New User ID:', newUserId);
    
    // First, verify the auth user exists and can sign in
    console.log('\n1️⃣ Verifying auth user...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      console.log('❌ Auth verification failed:', signInError.message);
      return;
    }
    
    console.log('✅ Auth user verified!');
    console.log('🆔 Confirmed User ID:', signInData.user.id);
    
    // Check if old admin record exists
    console.log('\n2️⃣ Checking for existing admin record...');
    const { data: oldAdmin, error: oldAdminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', oldAdminId)
      .single();
    
    if (oldAdminError) {
      console.log('❌ Error checking old admin record:', oldAdminError.message);
      
      // Try to find admin by email instead
      const { data: adminByEmail, error: emailError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email);
      
      if (emailError) {
        console.log('❌ Error checking admin by email:', emailError.message);
      } else if (adminByEmail && adminByEmail.length > 0) {
        console.log('✅ Found admin record by email:', adminByEmail[0]);
        
        // Update the existing record with new ID
        console.log('\n3️⃣ Updating admin record ID...');
        const { data: updateData, error: updateError } = await supabase
          .from('admins')
          .update({ id: signInData.user.id })
          .eq('email', email)
          .select();
        
        if (updateError) {
          console.log('❌ Error updating admin record:', updateError.message);
        } else {
          console.log('✅ Admin record updated successfully!');
          console.log('📊 Updated record:', updateData);
        }
      } else {
        console.log('❌ No admin record found by email either');
        
        // Create new admin record
        console.log('\n3️⃣ Creating new admin record...');
        const { data: insertData, error: insertError } = await supabase
          .from('admins')
          .insert({
            id: signInData.user.id,
            email: email,
            name: "ArchPlan Admin",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
        
        if (insertError) {
          console.log('❌ Error creating admin record:', insertError.message);
        } else {
          console.log('✅ Admin record created successfully!');
          console.log('📊 New record:', insertData);
        }
      }
    } else {
      console.log('✅ Found existing admin record:', oldAdmin);
      
      // Update the existing record with new ID
      console.log('\n3️⃣ Updating admin record ID...');
      const { data: updateData, error: updateError } = await supabase
        .from('admins')
        .update({ 
          id: signInData.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', oldAdminId)
        .select();
      
      if (updateError) {
        console.log('❌ Error updating admin record:', updateError.message);
      } else {
        console.log('✅ Admin record updated successfully!');
        console.log('📊 Updated record:', updateData);
      }
    }
    
    console.log('\n🌐 You can now login at: http://localhost:5000/admin/login');
    console.log('🔑 Email:', email);
    console.log('🔑 Password:', password);
    
  } catch (error: any) {
    console.error('❌ Error fixing admin record:', error.message || error);
    console.error('Full error:', error);
  }
}

fixAdminRecord();