const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from both locations (same as production)
dotenv.config({ path: path.join(__dirname, '.env') }); // Root .env
dotenv.config({ path: path.join(__dirname, 'server/.env') }); // Server .env

console.log('🔍 Production Email Test - Environment Check');
console.log('='.repeat(50));

// Check environment variables
console.log('📧 Email Configuration:');
console.log('  EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing');
console.log('  CLIENT_URL:', process.env.CLIENT_URL || 'Not set');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'Not set');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('❌ Missing email credentials!');
  process.exit(1);
}

// Create transporter with detailed logging
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: true, // Enable debug logging
  logger: true // Enable logger
});

async function testEmailInProduction() {
  try {
    console.log('\n🔗 Testing SMTP connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    console.log('\n📤 Sending test email...');
    
    // Send test email (similar to approval email)
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: 'Production Email Test - User Approval Simulation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to ArchPlan!</h2>
          <p>This is a test email to verify production email functionality.</p>
          <p>Your account has been approved and you can now access the platform.</p>
          <div style="margin: 20px 0;">
            <a href="${process.env.CLIENT_URL}/login" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Login to ArchPlan
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            This is a production email test sent at ${new Date().toISOString()}
          </p>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📧 Response:', result.response);
    
    return true;
  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error command:', error.command);
    
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
    
    return false;
  }
}

// Run the test
testEmailInProduction()
  .then(success => {
    if (success) {
      console.log('\n🎉 Production email test completed successfully!');
      console.log('📧 Check your inbox for the test email.');
    } else {
      console.log('\n💥 Production email test failed!');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });