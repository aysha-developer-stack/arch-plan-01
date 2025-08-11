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

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// CORS configuration with proper origin validation
const allowedOrigins = [
  'https://arch-plan-01-production.up.railway.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173' // Vite preview mode
];

// Function to validate and normalize origins
const validateOrigin = (origin: string): string => {
  if (!origin) return origin;
  
  // If origin doesn't start with http:// or https://, add https://
  if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
    return `https://${origin}`;
  }
  return origin;
};

// Enhanced CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const normalizedOrigin = validateOrigin(origin);
    
    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin} (normalized: ${normalizedOrigin})`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-HTTP-Method-Override'
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
    const PORT = process.env.PORT || 3001;
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
