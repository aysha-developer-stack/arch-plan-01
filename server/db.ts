import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Supabase URL is not set');
  process.exit(1);
}
if (!supabaseUrl.includes('supabase.co')) {
  console.error('Supabase URL must point to a supabase.co project');
  process.exit(1);
}
if (!supabaseServiceKey && !supabaseAnonKey) {
  console.error('Supabase keys are not set');
  process.exit(1);
}

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    fetch: (url: any, options: any = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      return fetch(url, { ...options, signal: controller.signal }).finally(() => {
        clearTimeout(timeoutId);
      });
    }
  },
  db: {
    schema: 'public'
  }
} as const;

export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, clientOptions)
  : undefined as any;

export const supabasePublic = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, clientOptions)
  : supabaseAdmin;

export const supabase = supabaseAdmin || supabasePublic;
