const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'server/.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Email Configuration Test:');
console.log('========================');
console.log('EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET');
console.log('CLIENT_URL:', process.env.CLIENT_URL || 'NOT SET');

// Test if email service can be initialized
try {
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  console.log('\nTransporter created successfully');
  
  // Test connection (without sending email)
  transporter.verify((error, success) => {
    if (error) {
      console.log('Email configuration error:', error.message);
    } else {
      console.log('Email server is ready to take our messages');
    }
  });
  
} catch (error) {
  console.error('Error creating email transporter:', error.message);
}