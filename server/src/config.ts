import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development'
};

export default config;