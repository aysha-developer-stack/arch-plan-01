import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from both locations
dotenv.config({ path: path.join(__dirname, '../../.env') }); // Root .env
dotenv.config({ path: path.join(__dirname, '../.env') }); // Server .env

const config = {
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development'
};

export default config;