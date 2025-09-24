import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from both locations
dotenv.config({ path: path.join(__dirname, '../.env') }); // Root .env
dotenv.config({ path: path.join(__dirname, '.env') }); // Server .env

import express, { type Request, Response, NextFunction } from "express";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import type { RequestHandler } from 'express';
import compression from 'compression';
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import emailService from "./src/services/emailService.js";

const app = express();

// Middleware
// Configure compression with optimized settings for PDF downloads
app.use(compression({
  filter: (req: Request, res: Response) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Compress all responses including PDFs for better transfer speed
    return true;
  },
  level: 6, // Balanced compression level (1-9, 6 is default)
  threshold: 1024, // Only compress responses larger than 1KB
  chunkSize: 16 * 1024, // 16KB chunks for better streaming
}));
// Configure body parser with increased limits for file uploads
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: false }));
app.use(cookieParser());

// Function to normalize origins by removing trailing slashes
const normalizeOrigin = (origin: string): string => {
  if (!origin) return origin;
  return origin.replace(/\/$/, ''); // Remove trailing slash
};

// CORS configuration with proper origin validation
const baseAllowedOrigins = [
  process.env.CORS_ORIGIN, // Use environment variable as primary
  'https://arch-plan-01-production.up.railway.app', // Explicit Railway frontend URL
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173', // Vite preview mode
  'http://localhost:5000'  // Additional dev port
].filter(Boolean) as string[]; // Remove any undefined values and assert type

// Normalize all origins and create both with and without trailing slash versions
const allowedOrigins: string[] = baseAllowedOrigins.reduce((acc: string[], origin: string) => {
  const normalized = normalizeOrigin(origin);
  acc.push(normalized); // Without trailing slash
  acc.push(normalized + '/'); // With trailing slash
  return acc;
}, [] as string[]);

console.log('🔧 CORS Configuration:');
console.log('   CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('   allowedOrigins:', allowedOrigins);

// Function to validate and normalize origins
const validateOrigin = (origin: string): string => {
  if (!origin) return origin;

  // If origin doesn't start with http:// or https://, add https://
  if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
    return `https://${origin}`;
  }
  return normalizeOrigin(origin); // Always normalize by removing trailing slash
};

// Security middleware for admin routes
app.use('/admin', (req: Request, res: Response, next: NextFunction) => {
  // Prevent caching of admin pages
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Additional security headers
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  next();
});

// Security middleware for admin API routes
app.use('/api/admin', (req: Request, res: Response, next: NextFunction) => {
  // Prevent caching of admin API responses
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  next();
});

// Enhanced CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const normalizedOrigin = validateOrigin(origin);

    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, normalizedOrigin); // Return the exact origin that was matched
    } else {
      console.log(`CORS blocked origin: ${origin} (normalized: ${normalizedOrigin})`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials',
    'Set-Cookie',
    'Cache-Control',
    'X-HTTP-Method-Override'
  ],
  exposedHeaders: [
    'Set-Cookie',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Remove manual CORS headers to avoid conflicts
// The cors middleware above should handle all CORS requirements

// Trust first proxy (needed for secure cookies in production if behind a proxy like nginx)
app.set('trust proxy', 1);

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    cors_origin: process.env.CORS_ORIGIN || 'not set',
    node_env: process.env.NODE_ENV,
    port: process.env.PORT,
    uptime: process.uptime()
  });
});

// Root health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'ArchPlan Live',
    timestamp: new Date().toISOString()
  });
});

// Simple root endpoint to test basic connectivity
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });
  next();
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error('Error:', message);
});

// Start the server
const startServer = async () => {
  try {
    // Register API routes BEFORE Vite middleware to ensure they take precedence
    const server = await registerRoutes(app);
    console.log("✅ API routes registered");

    // Setup Vite in development or serve static files in production
    if (process.env.NODE_ENV === "development") {
      console.log("🛠️ Setting up Vite development server...");
      await setupVite(app, server);
    } else {
      console.log("📦 Serving static files...");
      serveStatic(app);
    }

    // Debug: Log ALL environment variables for Railway - Force rebuild for asset sync
    console.log(`🔧 Environment Debug:`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   PORT (env): ${process.env.PORT}`);
    console.log(`   Railway App URL: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'not set'}`);
    console.log(`   All Railway env vars:`);
    Object.keys(process.env)
      .filter(key => key.includes('RAILWAY') || key === 'PORT')
      .forEach(key => console.log(`     ${key}: ${process.env[key]}`));
    console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
    console.log('RAILWAY_PROJECT_ID:', process.env.RAILWAY_PROJECT_ID);
    console.log('RAILWAY_SERVICE_ID:', process.env.RAILWAY_SERVICE_ID);
    
    // Railway sets PORT environment variable - we must use exactly what Railway provides
    const PORT = parseInt(process.env.PORT || '3000', 10);
    console.log(`   PORT (final): ${PORT}`);
    
    if (process.env.NODE_ENV === 'production') {
      // Railway requires binding to 0.0.0.0 and the exact PORT it provides
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT} (bound to 0.0.0.0 for Railway)`);
        console.log(`🌐 Server should be accessible at: https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'your-app.railway.app'}`);
        console.log(`🔍 Railway Debug: Listening on 0.0.0.0:${PORT} as required by Railway proxy`);
        
        // Initialize email service to trigger constructor logs
        console.log('📧 Initializing email service...');
        try {
          // This will trigger the constructor and show email configuration
          const testEmailService = emailService;
          console.log('✅ Email service initialized successfully');
        } catch (error) {
          console.error('❌ Email service initialization failed:', error);
        }
        
        // Add a simple health check log
        setTimeout(() => {
          console.log(`💓 Server health check: Still running after 5 seconds`);
        }, 5000);
      });
    } else {
      // Development: bind to localhost only for security
      server.listen(PORT, 'localhost', () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    }

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();
