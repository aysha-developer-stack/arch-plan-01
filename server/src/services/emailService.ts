import nodemailer from 'nodemailer';
import config from '../config.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    console.log('🔧 Initializing EmailService...');
    console.log('📧 Email User:', config.EMAIL_USER ? '✅ Set' : '❌ Missing');
    console.log('🔑 Email Password:', config.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing');
    console.log('🌐 Client URL:', config.CLIENT_URL);
    
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASSWORD
      },
      debug: process.env.NODE_ENV === 'production', // Enable debug in production
      logger: process.env.NODE_ENV === 'production'  // Enable logger in production
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      console.log('📤 Attempting to send email...');
      console.log('📧 To:', options.to);
      console.log('📋 Subject:', options.subject);
      console.log('🔧 From:', `"ArchPlan" <${config.EMAIL_USER}>`);
      
      const mailOptions = {
        from: `"ArchPlan" <${config.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully!');
      console.log('📧 Message ID:', result.messageId);
      console.log('📧 Response:', result.response);
    } catch (error) {
      console.error('❌ Error sending email:');
      console.error('Error type:', (error as any).constructor?.name);
      console.error('Error message:', (error as any).message);
      console.error('Error code:', (error as any).code);
      console.error('Error command:', (error as any).command);
      
      if ((error as any).response) {
        console.error('SMTP Response:', (error as any).response);
      }
      
      throw new Error(`Failed to send email: ${(error as any).message || 'Unknown error'}`);
    }
  }

  async sendApprovalEmail(userEmail: string, userName: string): Promise<void> {
    console.log('🎉 Sending approval email...');
    console.log('👤 User:', userName);
    console.log('📧 Email:', userEmail);
    
    const subject = 'Account Approved - Welcome to ArchPlan!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #28a745; margin: 0; text-align: center;">🎉 Account Approved!</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hello ${userName},</h2>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            Great news! Your ArchPlan account has been approved by our admin team. You can now access all the features and start exploring our architectural plans.
          </p>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #155724; font-weight: 500;">
              ✅ Your account is now active and ready to use!
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            You can now log in to your account and start browsing our collection of architectural plans.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${config.CLIENT_URL}/login" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Login to Your Account
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px; margin-top: 30px;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            This email was sent from ArchPlan. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({ to: userEmail, subject, html });
  }

  async sendRejectionEmail(userEmail: string, userName: string, rejectionReason: string): Promise<void> {
    const subject = 'Account Application Update - ArchPlan';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #dc3545; margin: 0; text-align: center;">Account Application Update</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hello ${userName},</h2>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            Thank you for your interest in ArchPlan. After reviewing your account application, we regret to inform you that we cannot approve your account at this time.
          </p>
          
          <div style="background-color: #f8d7da; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <p style="margin: 0; color: #721c24; font-weight: 500;">
              <strong>Reason:</strong> ${rejectionReason}
            </p>
          </div>
          
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0066cc;">
            <p style="margin: 0; color: #004085; font-weight: 500;">
              <strong>Alternative Option:</strong> If you would like to try again, you can register again using a different email address to submit a new login request.
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            If you believe this decision was made in error or if you have additional information that might change our assessment, please feel free to contact our support team.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${config.EMAIL_USER}" 
               style="background-color: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Contact Support
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px; margin-top: 30px;">
            We appreciate your understanding and thank you for your interest in ArchPlan.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            This email was sent from ArchPlan. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({ to: userEmail, subject, html });
  }
}

export default new EmailService();