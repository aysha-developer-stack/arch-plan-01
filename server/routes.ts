import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import { getStorage } from "./storage";
// import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPlanSchema, searchPlanSchema } from "./src/schema.js";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { authenticateAdmin } from "./src/middleware/authMiddleware";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Single admin session management
let activeAdminSession: {
  userId: string;
  email: string;
  loginTime: number;
  lastActivity: number;
} | null = null;

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Helper function to check if session is expired
function isSessionExpired(session: typeof activeAdminSession): boolean {
  if (!session) return true;
  return Date.now() - session.lastActivity > SESSION_TIMEOUT;
}

// Helper function to clean up expired sessions
function cleanupExpiredSession() {
  if (activeAdminSession && isSessionExpired(activeAdminSession)) {
    console.log(`🧹 Cleaning up expired admin session for ${activeAdminSession.email}`);
    activeAdminSession = null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Skip auth setup for now to get the app running
  // await setupAuth(app);

  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Auth routes (simplified for demo)
  app.post("/api/login", async (req, res) => {
    // Mock login endpoint for development
    const { email, password } = req.body;

    // Clean up any expired sessions first
    cleanupExpiredSession();

    // Simple mock authentication
    if (email && password) {
      // If the same admin is trying to log in again, allow it by clearing the existing session
      if (activeAdminSession && !isSessionExpired(activeAdminSession)) {
        if (activeAdminSession.email === email) {
          console.log(`🔄 Same admin (${email}) is logging in again, allowing session refresh`);
          activeAdminSession = null;
        } else {
          // A different admin is already logged in
          return res.status(423).json({
            success: false,
            message: `Admin portal is currently in use by ${activeAdminSession.email}. Please try again later.`,
            code: "ADMIN_SESSION_ACTIVE"
          });
        }
      }

      // Create new admin session
      const now = Date.now();
      activeAdminSession = {
        userId: "admin-user",
        email: email,
        loginTime: now,
        lastActivity: now
      };

      const mockUser = {
        id: "admin-user",
        email: email,
        firstName: "Admin",
        lastName: "User",
        profileImageUrl: null,
        token: "admin-jwt-token",
      };

      console.log(`🔐 New admin session started for ${email}`);
      res.json({ success: true, user: mockUser });
    } else {
      res.status(400).json({ success: false, message: "Email and password required" });
    }
  });

  app.post("/api/logout", async (req, res) => {
    // Clear the active admin session
    if (activeAdminSession) {
      console.log(`🚪 Admin session ended for ${activeAdminSession.email}`);
      activeAdminSession = null;
    }
    res.json({ success: true, message: "Logged out successfully" });
  });

  // Endpoint to clear admin session when navigating away from admin portal
  app.post("/api/admin/clear-session", async (req, res) => {
    const { email } = req.body;
    if (activeAdminSession && activeAdminSession.email === email) {
      console.log(`🔄 Clearing admin session for ${email} (navigated away)`);
      activeAdminSession = null;
      return res.json({ success: true, message: "Session cleared" });
    }
    res.json({ success: false, message: "No matching active session found" });
  });

  app.get("/api/auth/user", async (req: any, res) => {
    // Clean up expired sessions
    cleanupExpiredSession();

    // Check if there's an active admin session
    if (activeAdminSession && !isSessionExpired(activeAdminSession)) {
      // Update last activity
      activeAdminSession.lastActivity = Date.now();

      // Return the active admin user
      const adminUser = {
        id: activeAdminSession.userId,
        email: activeAdminSession.email,
        firstName: "Admin",
        lastName: "User",
        profileImageUrl: null,
        createdAt: new Date(activeAdminSession.loginTime),
        updatedAt: new Date(),
      };
      return res.json(adminUser);
    }

    // No active session
    res.status(401).json({ message: "No active admin session" });
  });

  // Check admin session status
  app.get("/api/admin/session-status", async (req, res) => {
    cleanupExpiredSession();

    if (activeAdminSession && !isSessionExpired(activeAdminSession)) {
      res.json({
        active: true,
        email: activeAdminSession.email,
        loginTime: activeAdminSession.loginTime,
        lastActivity: activeAdminSession.lastActivity
      });
    } else {
      res.json({ active: false });
    }
  });

  // Public plan search endpoint
  app.get("/api/plans/search", async (req, res) => {
    try {
      // Parse and validate search parameters using the schema
      const queryParams = {
        keyword: req.query.keyword as string,
        lotSize: req.query.lotSize as string,
        lotSizeMin: req.query.lotSizeMin as string,
        lotSizeMax: req.query.lotSizeMax as string,
        orientation: req.query.orientation as string,
        siteType: req.query.siteType as string,
        foundationType: req.query.foundationType as string,
        storeys: req.query.storeys as string,
        councilArea: req.query.councilArea as string,
        search: req.query.search as string,
        bedrooms: req.query.bedrooms as string,
        houseType: req.query.houseType as string,
        constructionType: req.query.constructionType as string,
        planType: req.query.planType as string,
        plotLength: req.query.plotLength as string,
        plotWidth: req.query.plotWidth as string,
        coveredArea: req.query.coveredArea as string,
        roadPosition: req.query.roadPosition as string,
        builderName: req.query.builderName as string,
        toilets: req.query.toilets as string,
        livingAreas: req.query.livingAreas as string,
        totalBuildingHeight: req.query.totalBuildingHeight as string,
        roofPitch: req.query.roofPitch as string,
        outdoorFeatures: req.query.outdoorFeatures as string,
        indoorFeatures: req.query.indoorFeatures as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };
      
      // Validate the search parameters
      const filters = searchPlanSchema.parse(queryParams);

      const plans = await getStorage().searchPlans(filters);
      res.json(plans);
    } catch (error) {
      console.error("Error searching plans:", error);
      res.status(500).json({ message: "Failed to search plans" });
    }
  });

  // Get total downloads across all plans
  app.get("/api/plans/total-downloads", async (req, res) => {
    try {
      const stats = await getStorage().getPlanStats();
      res.json({ totalDownloads: stats.totalDownloads });
    } catch (error) {
      console.error("Error fetching total downloads:", error);
      res.status(500).json({ message: "Failed to fetch total downloads" });
    }
  });

  // Get plan by ID
  app.get("/api/plans/:id", async (req, res) => {
    try {
      const plan = await getStorage().getPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching plan:", error);
      res.status(500).json({ message: "Failed to fetch plan" });
    }
  });

  // Track active requests to prevent multiple simultaneous requests
  const activeRequests = new Map<string, boolean>();

  // Get current user's download count
  app.get("/api/users/me/downloads", async (req, res) => {
    try {
      const authHeader = req.headers["authorization"] || req.headers["Authorization"];
      if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid Authorization header" });
      }
      const token = authHeader.slice(7);
      const secret = process.env.JWT_SECRET || "dev-secret";
      let userId: string | null = null;
      try {
        const payload: any = jwt.verify(token, secret);
        userId = payload?.id || payload?.userId || null;
      } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }
      const user = await getStorage().upsertUser({ id: userId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json({ downloadCount: user.downloadCount || 0 });
    } catch (err) {
      console.error("Failed to get user download count", err);
      return res.status(500).json({ message: "Failed to get user download count" });
    }
  });

  // Track download sessions to prevent duplicate counting
  const downloadSessions = new Map<string, number>();
  const SESSION_TIMEOUT = 30000; // 30 seconds

  // View plan PDF in browser (simplified and more reliable)
  app.get("/api/plans/:id/view", async (req, res) => {
    try {
      console.log("👁️ PDF View request for plan ID:", req.params.id);

      const plan = await getStorage().getPlan(req.params.id);
      if (!plan) {
        console.log("❌ Plan not found:", req.params.id);
        return res.status(404).send('Plan not found');
      }

      // Check if plan has content stored in database first
      if (plan.content) {
        console.log("✅ Serving PDF from database content");
        const contentBuffer = Buffer.from(plan.content, 'base64');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="' + (plan.fileName || 'plan.pdf') + '"');
        res.setHeader('Content-Length', contentBuffer.length.toString());
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');

        return res.send(contentBuffer);
      }

      // Fallback to file system with improved path resolution
      if (plan.filePath) {
        console.log("📁 Original file path from database:", plan.filePath);

        let filePath;
        let fileName = plan.fileName;

        // Extract filename from path if it contains Docker/container paths
        if (plan.filePath.includes('/app/uploads/') || plan.filePath.includes('\\app\\uploads\\')) {
          // Extract just the filename from Docker container path
          fileName = path.basename(plan.filePath);
          filePath = path.join(process.cwd(), 'uploads', fileName);
          console.log("🐳 Detected Docker path, using local uploads directory");
        } else {
          // Handle normal paths
          const normalizedPath = plan.filePath.replace(/\\/g, '/');
          filePath = path.isAbsolute(normalizedPath)
            ? normalizedPath
            : path.join(process.cwd(), normalizedPath);
        }

        console.log("🔍 Checking file path:", filePath);

        if (fs.existsSync(filePath)) {
          console.log("✅ Serving PDF from file system");

          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline; filename="' + (fileName || 'plan.pdf') + '"');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('X-Frame-Options', 'SAMEORIGIN');

          return res.sendFile(path.resolve(filePath));
        } else {
          console.log("❌ File not found at:", filePath);

          // Try to find the file by searching the uploads directory
          const uploadsDir = path.join(process.cwd(), 'uploads');
          if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            console.log("📂 Available files in uploads:", files);

            // Look for files with similar names or timestamps
            const targetFileName = path.basename(plan.filePath);
            const foundFile = files.find(file => file === targetFileName);

            if (foundFile) {
              const foundFilePath = path.join(uploadsDir, foundFile);
              console.log("🔍 Found matching file:", foundFilePath);

              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', 'inline; filename="' + (fileName || 'plan.pdf') + '"');
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('X-Frame-Options', 'SAMEORIGIN');

              return res.sendFile(path.resolve(foundFilePath));
            }
          }
        }
      }

      console.log("❌ No file or content available for plan:", req.params.id);
      return res.status(404).send('File not found');

    } catch (error) {
      console.error("❌ Error in PDF view endpoint:", error);
      return res.status(500).send('Server error');
    }
  });

  // Quick reset for specific plan (GET request for easy browser access)
  app.get("/api/plans/689209274ea8755c4fc556af/fix-count", async (req, res) => {
    try {
      await getStorage().resetDownloadCount("689209274ea8755c4fc556af", 1);
      console.log("✅ Reset download count for plan 689209274ea8755c4fc556af to 1");
      res.json({
        message: "Download count reset successfully",
        planId: "689209274ea8755c4fc556af",
        newCount: 1
      });
    } catch (error) {
      console.error("Reset download count error:", error);
      res.status(500).json({
        message: "Failed to reset download count",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Reset download count endpoint
  app.post("/api/plans/:id/reset-downloads", async (req, res) => {
    try {
      const planId = req.params.id;
      const newCount = parseInt(req.body.count) || 0;

      // Update the download count directly in the database
      await getStorage().resetDownloadCount(planId, newCount);

      res.json({
        message: "Download count reset successfully",
        planId,
        newCount
      });
    } catch (error) {
      console.error("Reset download count error:", error);
      res.status(500).json({
        message: "Failed to reset download count",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Debug endpoint to inspect plan data
  app.get("/api/plans/:id/debug", async (req, res) => {
    try {
      const plan = await getStorage().getPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      const debugInfo = {
        id: plan._id,
        title: plan.title,
        fileName: plan.fileName,
        filePath: plan.filePath,
        fileSize: plan.fileSize,
        hasContent: !!plan.content,
        contentLength: plan.content ? plan.content.length : 0,
        contentPreview: plan.content ? plan.content.substring(0, 100) + '...' : null,
        contentType: typeof plan.content,
        deploymentInfo: {
          nodeEnv: process.env.NODE_ENV,
          workingDir: process.cwd(),
          timestamp: new Date().toISOString()
        }
      };

      res.json(debugInfo);
    } catch (error) {
      console.error("Debug endpoint error:", error);
      res.status(500).json({ message: "Debug failed", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Admin Migration Tool - Scan and fix legacy plans with missing files
  app.get("/api/admin/plans/migration-scan", authenticateAdmin, async (req, res) => {
    try {
      console.log("🔍 Starting legacy plan migration scan...");

      // Get all plans
      const allPlans = await getStorage().getRecentPlans(1000000);
      console.log(`📊 Found ${allPlans.length} total plans to scan`);

      const results = {
        totalPlans: allPlans.length,
        healthyPlans: 0,
        recoverablePlans: 0,
        problematicPlans: 0,
        details: [] as any[]
      };

      for (const plan of allPlans) {
        const planResult = {
          id: plan._id.toString(),
          title: plan.title,
          fileName: plan.fileName,
          originalPath: plan.filePath,
          status: 'unknown' as 'healthy' | 'recoverable' | 'problematic',
          issues: [] as string[],
          solutions: [] as string[],
          hasContent: !!plan.content,
          contentSize: plan.content ? plan.content.length : 0
        };

        // Check if plan has content in database
        if (plan.content) {
          planResult.status = 'healthy';
          planResult.solutions.push('Content available in database');
          results.healthyPlans++;
        } else if (plan.filePath) {
          // Try to find the file using the same logic as download endpoint
          let fileFound = false;
          const originalPath = plan.filePath;

          // Strategy 1: Try the path as stored in DB
          let filePath;
          if (path.isAbsolute(originalPath)) {
            filePath = originalPath;
          } else {
            filePath = path.join(process.cwd(), originalPath);
          }

          if (fs.existsSync(filePath)) {
            fileFound = true;
            planResult.status = 'healthy';
            planResult.solutions.push(`File found at: ${filePath}`);
          }

          // Strategy 2: Try relative to server directory
          if (!fileFound) {
            const serverRelativePath = path.join(__dirname, '..', originalPath);
            if (fs.existsSync(serverRelativePath)) {
              fileFound = true;
              planResult.status = 'recoverable';
              planResult.solutions.push(`File found at: ${serverRelativePath}`);
              planResult.solutions.push('Can be migrated to correct location');
            }
          }

          // Strategy 3: Try uploads directory
          if (!fileFound) {
            const fileName = path.basename(originalPath);
            const uploadsPath = path.join(process.cwd(), 'uploads', fileName);
            if (fs.existsSync(uploadsPath)) {
              fileFound = true;
              planResult.status = 'recoverable';
              planResult.solutions.push(`File found in uploads: ${uploadsPath}`);
              planResult.solutions.push('Can update database path reference');
            }
          }

          // Strategy 4: Try server/uploads directory
          if (!fileFound) {
            const fileName = path.basename(originalPath);
            const serverUploadsPath = path.join(__dirname, 'uploads', fileName);
            if (fs.existsSync(serverUploadsPath)) {
              fileFound = true;
              planResult.status = 'recoverable';
              planResult.solutions.push(`File found in server/uploads: ${serverUploadsPath}`);
              planResult.solutions.push('Can update database path reference');
            }
          }

          if (fileFound) {
            if (planResult.status === 'healthy') {
              results.healthyPlans++;
            } else {
              results.recoverablePlans++;
            }
          } else {
            planResult.status = 'problematic';
            planResult.issues.push('Physical file not found in any location');
            planResult.issues.push('No content stored in database');
            planResult.solutions.push('Requires manual re-upload through admin panel');
            results.problematicPlans++;
          }
        } else {
          // No file path and no content
          planResult.status = 'problematic';
          planResult.issues.push('No file path specified');
          planResult.issues.push('No content stored in database');
          planResult.solutions.push('Requires manual re-upload through admin panel');
          results.problematicPlans++;
        }

        results.details.push(planResult);
      }

      console.log(`✅ Migration scan complete:`);
      console.log(`   - Healthy plans: ${results.healthyPlans}`);
      console.log(`   - Recoverable plans: ${results.recoverablePlans}`);
      console.log(`   - Problematic plans: ${results.problematicPlans}`);

      res.json(results);
    } catch (error) {
      console.error("Migration scan error:", error);
      res.status(500).json({
        message: "Migration scan failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Admin Migration Tool - Fix recoverable plans
  app.post("/api/admin/plans/migration-fix", authenticateAdmin, async (req, res) => {
    try {
      const { planIds, action } = req.body;

      if (!planIds || !Array.isArray(planIds)) {
        return res.status(400).json({ message: "planIds array is required" });
      }

      if (!action || !['migrate-files', 'store-in-db', 'update-paths'].includes(action)) {
        return res.status(400).json({
          message: "action is required (migrate-files, store-in-db, or update-paths)"
        });
      }

      console.log(`🔧 Starting migration fix for ${planIds.length} plans with action: ${action}`);

      const results = {
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        details: [] as any[]
      };

      for (const planId of planIds) {
        results.totalProcessed++;
        const planResult = {
          id: planId,
          success: false,
          action: action,
          message: '',
          error: null as string | null
        };

        try {
          const plan = await getStorage().getPlan(planId);
          if (!plan) {
            planResult.error = 'Plan not found';
            results.details.push(planResult);
            results.failed++;
            continue;
          }

          if (action === 'store-in-db' && plan.filePath) {
            // Find the file and store its content in database
            let fileFound = false;
            let filePath = '';
            let fileContent = '';

            // Use same search logic as scan
            const originalPath = plan.filePath;

            // Try different locations
            const searchPaths = [
              path.isAbsolute(originalPath) ? originalPath : path.join(process.cwd(), originalPath),
              path.join(__dirname, '..', originalPath),
              path.join(process.cwd(), 'uploads', path.basename(originalPath)),
              path.join(__dirname, 'uploads', path.basename(originalPath))
            ];

            for (const searchPath of searchPaths) {
              if (fs.existsSync(searchPath)) {
                filePath = searchPath;
                fileFound = true;
                break;
              }
            }

            if (fileFound) {
              // Read file and convert to base64
              const fileBuffer = fs.readFileSync(filePath);
              fileContent = fileBuffer.toString('base64');

              // Update plan with content
              await getStorage().updatePlan(planId, { content: fileContent });

              planResult.success = true;
              planResult.message = `File content stored in database (${fileBuffer.length} bytes)`;
              results.successful++;
            } else {
              planResult.error = 'File not found in any location';
              results.failed++;
            }
          } else if (action === 'update-paths' && plan.filePath) {
            // Update database with correct file path
            let correctPath = '';
            const originalPath = plan.filePath;

            const searchPaths = [
              { path: path.join(process.cwd(), 'uploads', path.basename(originalPath)), dbPath: `uploads/${path.basename(originalPath)}` },
              { path: path.join(__dirname, 'uploads', path.basename(originalPath)), dbPath: `server/uploads/${path.basename(originalPath)}` }
            ];

            for (const { path: searchPath, dbPath } of searchPaths) {
              if (fs.existsSync(searchPath)) {
                correctPath = dbPath;
                break;
              }
            }

            if (correctPath) {
              await getStorage().updatePlan(planId, { filePath: correctPath });
              planResult.success = true;
              planResult.message = `Updated file path to: ${correctPath}`;
              results.successful++;
            } else {
              planResult.error = 'File not found in any recoverable location';
              results.failed++;
            }
          } else {
            planResult.error = `Action ${action} not implemented or invalid for this plan`;
            results.failed++;
          }

        } catch (error) {
          planResult.error = error instanceof Error ? error.message : String(error);
          results.failed++;
        }

        results.details.push(planResult);
      }

      console.log(`✅ Migration fix complete:`);
      console.log(`   - Successful: ${results.successful}`);
      console.log(`   - Failed: ${results.failed}`);

      res.json(results);
    } catch (error) {
      console.error("Migration fix error:", error);
      res.status(500).json({
        message: "Migration fix failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Download plan PDF
  app.get("/api/plans/:id/download", async (req, res) => {
    console.log("🚀 === DOWNLOAD REQUEST STARTED ===");
    console.log("📋 Request details:", {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      params: req.params,
      planId: req.params.id,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent']
    });
    console.log("🔍 Plan ID being requested:", req.params.id);
    console.log("✅ Download endpoint reached - not intercepted by frontend");

    // --- Duplicate request protection for download count ---
    const planId = req.params.id;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const sessionKey = `download-${planId}-${clientIP}`;
    const now = Date.now();

    // Check if this is a duplicate request within the session timeout
    const lastRequestTime = downloadSessions.get(sessionKey);
    const isDuplicateRequest = lastRequestTime && (now - lastRequestTime) < SESSION_TIMEOUT;

    let shouldIncrementCount = false;
    if (!isDuplicateRequest) {
      // This is a new download session, track it
      downloadSessions.set(sessionKey, now);
      shouldIncrementCount = true;

      // Clean up old sessions (older than 5 minutes)
      Array.from(downloadSessions.entries()).forEach(([key, timestamp]) => {
        if (now - timestamp > 300000) { // 5 minutes
          downloadSessions.delete(key);
        }
      });

      console.log(`🆕 New download session started for plan ${planId} from ${clientIP}`);
    } else {
      console.log(`🔄 Duplicate download request detected for plan ${planId} from ${clientIP} (within ${SESSION_TIMEOUT}ms)`);
    }

    try {
      console.log("🔍 Looking up plan with ID:", req.params.id);
      const plan = await getStorage().getPlan(req.params.id);
      console.log("📄 Plan lookup result:", plan ? {
        id: plan._id,
        fileName: plan.fileName,
        filePath: plan.filePath,
        title: plan.title
      } : "❌ Plan not found");

      if (!plan) {
        console.error("Plan not found for ID:", req.params.id);
        return res.status(404).json({ message: "Plan not found" });
      }

      // Handle file path resolution with multiple fallback strategies
      let filePath;
      const originalPath = plan.filePath;
      console.log("Original file path from DB:", originalPath);
      console.log("Current working directory:", process.cwd());

      // Streamlined file path resolution - try absolute path first, then relative to project root
      if (path.isAbsolute(originalPath)) {
        filePath = originalPath;
      } else {
        filePath = path.join(process.cwd(), originalPath);
      }

      // If file doesn't exist, try uploads directory as fallback
      if (!fs.existsSync(filePath)) {
        const fileName = path.basename(originalPath);
        filePath = path.join(process.cwd(), 'uploads', fileName);
      }

      console.log("📁 Resolved file path:", filePath);
      console.log("📄 File exists:", fs.existsSync(filePath));

      if (!fs.existsSync(filePath)) {
        console.log("⚠️ Physical file not found, checking if plan has content data in database...");
        console.log("   Original path:", originalPath);
        console.log("   Final attempted path:", filePath);

        // Check if plan has content stored in database
        console.log("🔍 Checking plan content in database...");
        console.log("   - Has content property:", !!plan.content);
        console.log("   - Content type:", typeof plan.content);
        console.log("   - Content length:", plan.content ? plan.content.length : 0);
        console.log("   - Content preview:", plan.content ? plan.content.substring(0, 50) + '...' : 'null');

        // Increment download count once for successful download (regardless of source)
        if (shouldIncrementCount) {
          console.log("🔢 Attempting to increment download count for plan:", plan._id.toString());
          console.log("🔢 Current download count before increment:", plan.downloadCount || 0);
          try {
            await getStorage().incrementDownloadCount(plan._id.toString());
            console.log("✅ Download count incremented successfully");

            // Verify the increment worked by fetching the plan again
            const updatedPlan = await getStorage().getPlan(plan._id.toString());
            console.log("🔍 Download count after increment:", updatedPlan?.downloadCount || 0);
          } catch (error) {
            console.error("❌ Failed to increment download count:", error);
            console.error("❌ Error details:", error instanceof Error ? error.stack : error);
          }
        }

        if (plan.content) {
          console.log("✅ Found plan content in database, serving from memory");

          // Serve content from database
          console.log("🔄 Converting base64 content to buffer...");
          const contentBuffer = Buffer.from(plan.content, 'base64');
          console.log("   - Buffer created successfully:", !!contentBuffer);
          console.log("   - Buffer length:", contentBuffer.length);
          console.log("   - Buffer first 10 bytes:", contentBuffer.slice(0, 10));

          // Validate PDF header
          const pdfHeader = contentBuffer.slice(0, 4);
          if (pdfHeader.toString() !== '%PDF') {
            console.error("❌ Invalid PDF header in database content:", pdfHeader.toString());
            return res.status(500).json({
              message: "Stored file is not a valid PDF",
              details: { header: pdfHeader.toString() }
            });
          }

          const fileName = plan.fileName || `${plan.title || 'plan'}.pdf`;

          // Set proper headers for inline PDF viewing (bypasses IDM)
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${plan.title || 'plan'}.pdf"`);
          res.setHeader('Content-Length', contentBuffer.length.toString());
          res.setHeader('Cache-Control', 'public, max-age=3600');
          res.setHeader('Accept-Ranges', 'bytes');

          console.log(`🚀 Serving plan from database: ${contentBuffer.length} bytes`);
          return res.send(contentBuffer);
        }

        console.error("❌ No physical file and no content in database!");
        console.log("💡 This plan was likely uploaded before the database storage fix.");
        console.log("💡 Solution: Re-upload this plan through the admin panel.");

        return res.status(404).json({
          message: "File not available - please re-upload this plan through the admin panel",
          details: {
            originalPath,
            attemptedPath: filePath,
            hasContent: !!plan.content,
            solution: "This plan was uploaded before database storage was implemented. Please re-upload it through the admin panel."
          }
        });
      }

      console.log("✅ File found! Setting headers and serving file...");

      // --- Increment download count for total downloads tracking (only for new sessions) ---
      if (shouldIncrementCount) {
        console.log("🔢 Incrementing download count for plan:", plan._id.toString());
        console.log("🔢 Current download count before increment:", plan.downloadCount || 0);
        try {
          await getStorage().incrementDownloadCount(plan._id.toString());
          console.log("✅ Download count incremented successfully");

          // Verify the increment worked by fetching the plan again
          const updatedPlan = await getStorage().getPlan(plan._id.toString());
          console.log("🔍 Download count after increment:", updatedPlan?.downloadCount || 0);
        } catch (error) {
          console.error("❌ Failed to increment download count:", error);
          console.error("❌ Error details:", error instanceof Error ? error.stack : error);
          // Continue with download even if count increment fails
        }
      } else {
        console.log("🔄 Skipping download count increment (duplicate request)");
      }

      // Get file stats for proper headers
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      console.log(`📊 File stats:`);
      console.log(`   - Size: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`   - Modified: ${stats.mtime}`);
      console.log(`   - Is file: ${stats.isFile()}`);
      console.log(`   - Is readable: ${fs.constants.R_OK}`);

      // Check if file is empty
      if (fileSize === 0) {
        console.error("❌ ERROR: File is empty (0 bytes)!");
        console.error(`   Plan ID: ${plan._id}`);
        console.error(`   Plan fileName: ${plan.fileName}`);
        console.error(`   File path: ${filePath}`);
        return res.status(500).json({
          message: "File is empty",
          details: {
            planId: plan._id,
            fileName: plan.fileName,
            filePath: filePath,
            fileSize: fileSize
          }
        });
      }

      // Read first few bytes to validate it's a PDF
      try {
        const buffer = Buffer.alloc(8);
        const fd = fs.openSync(filePath, 'r');
        const bytesRead = fs.readSync(fd, buffer, 0, 8, 0);
        fs.closeSync(fd);

        const header = buffer.toString('hex', 0, bytesRead);
        const headerText = buffer.toString('ascii', 0, Math.min(4, bytesRead));
        console.log(`📄 File header (first ${bytesRead} bytes): ${header}`);
        console.log(`📄 File header as text: ${headerText}`);

        // PDF files should start with %PDF
        if (headerText !== '%PDF') {
          console.error(`❌ Invalid PDF file! Expected: %PDF, Got: ${headerText}`);
          return res.status(500).json({
            message: "File is not a valid PDF",
            details: {
              expectedHeader: "%PDF",
              actualHeader: headerText,
              filePath: filePath
            }
          });
        } else {
          console.log(`✅ Valid PDF header detected: ${headerText}`);
        }
      } catch (headerError) {
        console.error(`❌ Error reading file header:`, headerError);
        return res.status(500).json({
          message: "Failed to validate PDF file",
          error: headerError instanceof Error ? headerError.message : String(headerError)
        });
      }

      // Set comprehensive headers for inline PDF viewing (bypasses IDM)
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("Content-Length", fileSize.toString());
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
      res.setHeader("ETag", `"${stats.mtime.getTime()}-${fileSize}"`); // ETag for conditional requests
      res.setHeader("Last-Modified", stats.mtime.toUTCString());
      res.setHeader("X-Content-Type-Options", "nosniff");

      console.log(`🚀 Starting file download for ${fileSize} bytes...`);
      console.log(`   Plan ID: ${plan._id}`);
      console.log(`   File name: ${plan.fileName}`);
      console.log(`   File path: ${filePath}`);

      // Use streaming for better performance and memory efficiency
      const absolutePath = path.resolve(filePath);
      console.log("Streaming file from absolute path:", absolutePath);

      const fileName = plan.fileName || `${plan.title || 'plan'}.pdf`;

      // Set download headers
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Handle range requests for partial content and resume capability
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        
        console.log(`📦 Range request: bytes ${start}-${end}/${fileSize}`);
        
        res.status(206); // Partial Content
        res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
        res.setHeader("Content-Length", chunksize.toString());
        
        const fileStream = fs.createReadStream(absolutePath, { start, end });
        
        fileStream.on('error', (err) => {
          console.error("❌ Range stream error:", err);
          if (!res.headersSent) {
            res.status(500).json({ message: "Failed to stream file range" });
          }
        });
        
        fileStream.on('end', () => {
          console.log(`✅ Range streaming completed: ${chunksize} bytes`);
        });
        
        fileStream.pipe(res);
      } else {
        // Full file download
        const fileStream = fs.createReadStream(absolutePath);
        
        fileStream.on('error', (err) => {
          console.error("❌ Stream error:", err);
          if (!res.headersSent) {
            res.status(500).json({ message: "Failed to stream file" });
          }
        });
        
        fileStream.on('end', () => {
          console.log("✅ File streaming completed successfully!");
          console.log("🎉 === DOWNLOAD REQUEST COMPLETED ===");
        });
        
        // Pipe the file stream to response
        fileStream.pipe(res);
      }
    } catch (error) {
      console.error("💥 Unexpected error in download handler:", error);
      console.error("   Error stack:", (error as Error).stack);
      if (!res.headersSent) {
        console.log("📤 Sending 500 error response");
        res.status(500).json({ message: "Failed to download plan" });
      }
    }

    console.log("📝 Download handler function completed (but file may still be sending)");
  });

  // Admin routes (simplified for demo)
  app.get("/api/admin/stats", authenticateAdmin, async (req, res) => {
    try {
      const stats = await getStorage().getPlanStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/plans", authenticateAdmin, async (req, res) => {
    try {
      // Parse and validate search parameters using the schema
      const queryParams = {
        lotSize: req.query.lotSize as string,
        orientation: req.query.orientation as string,
        siteType: req.query.siteType as string,
        foundationType: req.query.foundationType as string,
        storeys: req.query.storeys as string,
        councilArea: req.query.councilArea as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };
      
      // Validate the search parameters
      const filters = searchPlanSchema.parse(queryParams);
      const result = await getStorage().searchPlans(filters);
      // For admin endpoint, return just the plans array for backward compatibility
      res.json(result.plans);
    } catch (error) {
      console.error("Error fetching admin plans:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  app.post("/api/admin/plans", authenticateAdmin, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = "Admin"; // Mock user for demo
      // Convert absolute path to relative path for consistency
      const relativePath = path.relative(process.cwd(), req.file.path);

      // Read file content and convert to base64 for database storage
      // This ensures files work on cloud platforms like Railway
      let fileContent: string;
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        fileContent = fileBuffer.toString('base64');
        console.log(`📦 File content stored in database: ${fileContent.length} characters (base64)`);
      } catch (fileError) {
        console.warn("⚠️ Could not read file for database storage:", fileError);
        // Do not proceed if file cannot be read
        return res.status(500).json({ message: "Failed to read uploaded file for storage", error: fileError instanceof Error ? fileError.message : fileError });
      }

      // Always set both filePath and content on the plan record
      const planData = insertPlanSchema.parse({
        ...req.body,
        fileName: req.file.originalname,
        filePath: relativePath,
        fileSize: req.file.size,
        uploadedBy: userId,
        storeys: parseInt(req.body.storeys),
        // Parse numeric fields
        plotLength: req.body.plotLength ? parseFloat(req.body.plotLength) : undefined,
        plotWidth: req.body.plotWidth ? parseFloat(req.body.plotWidth) : undefined,
        coveredArea: req.body.coveredArea ? parseFloat(req.body.coveredArea) : undefined,
        totalBuildingHeight: req.body.totalBuildingHeight !== undefined && req.body.totalBuildingHeight !== '' ? parseFloat(req.body.totalBuildingHeight) : undefined,
        roofPitch: req.body.roofPitch !== undefined && req.body.roofPitch !== '' ? parseFloat(req.body.roofPitch) : undefined,
        lotSizeMin: req.body.lotSizeMin !== undefined && req.body.lotSizeMin !== '' ? parseFloat(req.body.lotSizeMin) : undefined,
        lotSizeMax: req.body.lotSizeMax !== undefined && req.body.lotSizeMax !== '' ? parseFloat(req.body.lotSizeMax) : undefined,
        bedrooms: req.body.bedrooms ? parseInt(req.body.bedrooms) : undefined,
        toilets: req.body.toilets ? parseInt(req.body.toilets) : undefined,
        livingAreas: req.body.livingAreas ? parseInt(req.body.livingAreas) : undefined,
        // Handle string fields
        foundationType: req.body.foundationType !== undefined ? req.body.foundationType : undefined,
        builderName: req.body.builderName !== undefined ? req.body.builderName : undefined,
        // Handle construction type as a single value
        constructionType: req.body.constructionType ? [req.body.constructionType] : undefined,
        // Parse array fields from JSON strings
        outdoorFeatures: req.body.outdoorFeatures ? JSON.parse(req.body.outdoorFeatures) : undefined,
        indoorFeatures: req.body.indoorFeatures ? JSON.parse(req.body.indoorFeatures) : undefined,
        content: fileContent, // Always store file content in database
      });

      let plan;
      try {
        plan = await getStorage().createPlan(planData);
      } catch (dbError) {
        console.error('❌ Failed to save plan to database:', dbError);
        // Do NOT delete the file if DB save fails
        if (dbError instanceof Error) {
          return res.status(500).json({ message: 'Failed to save plan to database', error: dbError.message });
        } else {
          return res.status(500).json({ message: 'Failed to save plan to database', error: dbError });
        }
      }

      // Only clean up (delete) the file if both DB and file read succeeded
      if (fileContent) {
        try {
          fs.unlinkSync(req.file.path);
          console.log(`🧹 Cleaned up temporary file: ${req.file.path}`);
        } catch (cleanupError) {
          console.warn("⚠️ Could not clean up temporary file:", cleanupError);
        }
      } else {
        console.warn('⚠️ File was NOT deleted from disk due to file read error or missing content.');
      }

      res.json(plan);
    } catch (error) {
      console.error("Error uploading plan:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid plan data", errors: error.issues });
      }
      res.status(500).json({ message: "Failed to upload plan" });
    }
  });

  app.put("/api/admin/plans/:id", authenticateAdmin, async (req, res) => {
    try {
      // Process numeric fields and arrays before validation
      const processedData = {
        ...req.body,
        // Parse numeric fields if they exist
        plotLength: req.body.plotLength ? parseFloat(req.body.plotLength) : undefined,
        plotWidth: req.body.plotWidth ? parseFloat(req.body.plotWidth) : undefined,
        coveredArea: req.body.coveredArea ? parseFloat(req.body.coveredArea) : undefined,
        totalBuildingHeight: req.body.totalBuildingHeight !== undefined && req.body.totalBuildingHeight !== '' ? parseFloat(req.body.totalBuildingHeight) : undefined,
        roofPitch: req.body.roofPitch !== undefined && req.body.roofPitch !== '' ? parseFloat(req.body.roofPitch) : undefined,
        lotSizeMin: req.body.lotSizeMin !== undefined && req.body.lotSizeMin !== '' ? parseFloat(req.body.lotSizeMin) : undefined,
        lotSizeMax: req.body.lotSizeMax !== undefined && req.body.lotSizeMax !== '' ? parseFloat(req.body.lotSizeMax) : undefined,
        bedrooms: req.body.bedrooms ? parseInt(req.body.bedrooms) : undefined,
        toilets: req.body.toilets ? parseInt(req.body.toilets) : undefined,
        livingAreas: req.body.livingAreas ? parseInt(req.body.livingAreas) : undefined,
        storeys: req.body.storeys ? parseInt(req.body.storeys) : undefined,
        // Handle string fields
        foundationType: req.body.foundationType !== undefined ? req.body.foundationType : undefined,
        builderName: req.body.builderName !== undefined ? req.body.builderName : undefined,
        // Handle construction type as a single value
        constructionType: req.body.constructionType ? [req.body.constructionType] : undefined,
        // Parse array fields from JSON strings if they exist
        outdoorFeatures: req.body.outdoorFeatures ? (typeof req.body.outdoorFeatures === 'string' ? JSON.parse(req.body.outdoorFeatures) : req.body.outdoorFeatures) : undefined,
        indoorFeatures: req.body.indoorFeatures ? (typeof req.body.indoorFeatures === 'string' ? JSON.parse(req.body.indoorFeatures) : req.body.indoorFeatures) : undefined,
      };
      
      const updates = insertPlanSchema.partial().parse(processedData);
      const plan = await getStorage().updatePlan(req.params.id, updates);
      res.json(plan);
    } catch (error) {
      console.error("Error updating plan:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid plan data", errors: error.issues });
      }
      res.status(500).json({ message: "Failed to update plan" });
    }
  });

  app.delete("/api/admin/plans/:id", authenticateAdmin, async (req, res) => {
    try {
      const plan = await getStorage().getPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      // Delete file from filesystem
      let filePath;
      if (path.isAbsolute(plan.filePath)) {
        filePath = plan.filePath;
      } else {
        filePath = path.join(process.cwd(), plan.filePath);
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await getStorage().deletePlan(req.params.id);
      res.json({ message: "Plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting plan:", error);
      res.status(500).json({ message: "Failed to delete plan" });
    }
  });

  // Download plan endpoint
  app.get("/api/plans/:id/download", async (req, res) => {
    console.log(`🔽 Download endpoint hit for plan ID: ${req.params.id}`);
    console.log(`🔽 Full request URL: ${req.originalUrl}`);
    try {
      const plan = await getStorage().getPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      let filePath: string;
      let fileBuffer: Buffer;
      let fileName: string = plan.fileName || `${plan.title}.pdf`;

      // Try to serve from file system first
      if (plan.filePath) {
        filePath = path.join(process.cwd(), plan.filePath);
        if (fs.existsSync(filePath)) {
          fileBuffer = fs.readFileSync(filePath);
        } else if (plan.content) {
          // Fallback to database content if file doesn't exist
          fileBuffer = Buffer.from(plan.content, 'base64');
        } else {
          return res.status(404).json({ message: "File not found" });
        }
      } else if (plan.content) {
        // Serve from database content
        fileBuffer = Buffer.from(plan.content, 'base64');
      } else {
        return res.status(404).json({ message: "File not found" });
      }

      // Increment download count
      await getStorage().incrementDownloadCount(req.params.id);
      console.log(`📊 Download count incremented for plan: ${plan.title} (ID: ${req.params.id})`);

      // Set proper headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', fileBuffer.length.toString());

      // Send the file
      res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading plan:", error);
      res.status(500).json({ message: "Failed to download plan" });
    }
  });

  // View plan endpoint for inline PDF viewing in browser
  app.get("/api/plans/:id/view", async (req, res) => {
    try {
      console.log(`🔍 Attempting to view plan with ID: ${req.params.id}`);
      const plan = await getStorage().getPlan(req.params.id);
      if (!plan) {
        console.log(`❌ Plan not found in database: ${req.params.id}`);
        return res.status(404).json({ message: "Plan not found" });
      }
      console.log(`✅ Plan found: ${plan.title} (${plan.fileName})`);
      console.log(`📁 File path: ${plan.filePath || 'stored in database'}`);
      console.log(`💾 Has content: ${plan.content ? 'yes' : 'no'}`);


      let filePath: string;
      let fileBuffer: Buffer;
      let fileName: string = plan.fileName || `${plan.title}.pdf`;

      // Try to serve from file system first
      if (plan.filePath) {
        filePath = path.join(process.cwd(), plan.filePath);
        if (fs.existsSync(filePath)) {
          fileBuffer = fs.readFileSync(filePath);
        } else if (plan.content) {
          // Fallback to database content if file doesn't exist
          fileBuffer = Buffer.from(plan.content, 'base64');
        } else {
          return res.status(404).json({ message: "File not found" });
        }
      } else if (plan.content) {
        // Serve from database content
        fileBuffer = Buffer.from(plan.content, 'base64');
      } else {
        return res.status(404).json({ message: "File not found" });
      }

      // Set proper headers for inline PDF viewing
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.setHeader('Content-Length', fileBuffer.length.toString());

      // Send the file
      res.send(fileBuffer);
    } catch (error) {
      console.error("Error viewing plan:", error);
      res.status(500).json({ message: "Failed to view plan" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
