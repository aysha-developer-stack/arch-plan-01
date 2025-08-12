import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import connectDB from "./db";
import authRoutes from './src/routes/authRoutes';
import adminAuthRoutes from './src/routes/adminAuthRoutes';
import config from './src/config';
import { fileURLToPath } from "url";
import { initializeStorage } from "./storage";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// CORS configuration with proper origin validation
const allowedOrigins = [
  config.CORS_ORIGIN, // Use config CORS_ORIGIN as primary
  'https://arch-plan-01-production.up.railway.app', // Explicit Railway frontend URL
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173', // Vite preview mode
  'http://localhost:5000'  // Additional dev port
].filter(Boolean); // Remove any undefined values

console.log('🔧 CORS Configuration:');
console.log('   config.CORS_ORIGIN:', config.CORS_ORIGIN);
console.log('   allowedOrigins:', allowedOrigins);

// Function to validate and normalize origins
const validateOrigin = (origin: string): string => {
  if (!origin) return origin;

  // If origin doesn't start with http:// or https://, add https://
  if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
    return `https://${origin}`;
  }
  return origin;
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
    cors_origin: process.env.CORS_ORIGIN || 'not set'
  });
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

// API Routes (must come before Vite middleware)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminAuthRoutes);

// Direct login route for frontend compatibility
app.use('/api', authRoutes);

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
    // Connect to database
    await connectDB();
    console.log("🚀 Connected to database");

    // Initialize storage
    initializeStorage();
    console.log("💾 Storage initialized");

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

    // Start the server
    const PORT = config.PORT;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();
