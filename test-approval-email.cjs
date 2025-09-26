const dotenv = require('dotenv');
const path = require('path');
const nodemailer = require('nodemailer');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'server/.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Testing Approval Email Functionality');
console.log('===================================');

async function testApprovalEmail() {
  try {
    console.log('Email Configuration:');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET');
    console.log('CLIENT_URL:', process.env.CLIENT_URL);
    console.log('');

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Verify connection
    console.log('Verifying email connection...');
    await transporter.verify();
    console.log('✅ Email server connection verified');

    // Test email content (same as in emailService.ts)
    const testEmail = {
      from: `"ArchPlan" <${process.env.EMAIL_USER}>`,
      to: 'test@example.com', // Replace with a real email for testing
      subject: 'Account Approved - Welcome to ArchPlan!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #28a745; margin: 0; text-align: center;">🎉 Account Approved!</h1>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Hello Test User,</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Great news! Your ArchPlan account has been approved by our admin team. You can now access all the features and start exploring our architectural plans.
            </p>
            
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #155724; font-weight: 500;">
                ✅ Your account is now active and ready to use!
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/login" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                Login to Your Account
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              This is a test email from ArchPlan.
            </p>
          </div>
        </div>
      `
    };

    console.log('Attempting to send test approval email...');
    
    // Send test email to the configured email address (sending to self for testing)
    testEmail.to = process.env.EMAIL_USER; // Send to self for testing
    
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test approval email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Email sent to:', testEmail.to);
    console.log('');
    console.log('Please check the inbox of', testEmail.to, 'to verify the email was received.');

  } catch (error) {
    console.error('❌ Error testing approval email:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

testApprovalEmail();