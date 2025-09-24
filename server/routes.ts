import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage.js";
import { insertPlanSchema, searchPlanSchema } from "./src/schema.js";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { supabase } from "./db.js";

// Import route modules
import userRoutes from "./src/routes/userRoutes.js";
import adminUserRoutes from "./src/routes/adminUserRoutes.js";
import adminRoutes from "./src/routes/adminroutes.js";

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
    if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Register route modules
  app.use('/api/users', userRoutes);
  app.use('/api/admin/users', adminUserRoutes);
  app.use('/api/admin', adminRoutes);

  // Plan routes
  app.get("/api/plans", async (req, res) => {
    const storage = getStorage();
    try {
      const filters = searchPlanSchema.parse(req.query);
      const result = await storage.searchPlans(filters);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid query parameters", details: error.errors });
      }
      res.status(500).json({ message: "Error searching plans" });
    }
  });

  // Search plans endpoint - specific endpoint for frontend search interface
  app.get("/api/plans/search", async (req, res) => {
    const storage = getStorage();
    try {
      // Parse query parameters manually to handle string-to-number conversion
      const filters: any = { ...req.query };
      
      // Convert string parameters to numbers where needed
      if (filters.limit) filters.limit = parseInt(filters.limit as string);
      if (filters.offset) filters.offset = parseInt(filters.offset as string);
      
      // Validate with schema after conversion
      const validatedFilters = searchPlanSchema.parse(filters);
      const result = await storage.searchPlans(validatedFilters);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid query parameters", details: error.errors });
      }
      res.status(500).json({ message: "Error searching plans" });
    }
  });

  app.get("/api/plans/recent", async (req, res) => {
    const storage = getStorage();
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const plans = await storage.getRecentPlans(limit);
    res.json(plans);
  });

  app.get("/api/plans/stats", async (req, res) => {
    const storage = getStorage();
    const stats = await storage.getPlanStats();
    res.json(stats);
  });

  // Get total downloads for all plans - must be before /:id route
  app.get("/api/plans/total-downloads", async (req, res) => {
    try {
      const storage = getStorage();
      const stats = await storage.getPlanStats();
      res.json({ totalDownloads: stats.totalDownloads });
    } catch (error) {
      console.error('Error fetching total downloads:', error);
      res.status(500).json({ message: "Error fetching total downloads" });
    }
  });

  app.get("/api/plans/:id", async (req, res) => {
    const storage = getStorage();
    const plan = await storage.getPlan(req.params.id);
    if (plan) {
      res.json(plan);
    } else {
      res.status(404).json({ message: "Plan not found" });
    }
  });

  // Serve plan images
  app.get("/api/plans/:id/images/:fileId", async (req, res) => {
    try {
      const storage = getStorage();
      const plan = await storage.getPlan(req.params.id);
      
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      // Find the image with the matching fileId
      const image = plan.images?.find(img => img.fileId === req.params.fileId);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Check if it's a Supabase Storage path (doesn't start with http and doesn't contain local path separators)
      if (image.path && !image.path.startsWith('http') && !image.path.includes('\\') && !image.path.includes('/uploads/')) {
        // This is likely a Supabase Storage path, get the signed URL
        try {
          const storage = getStorage();
          const signedUrl = await storage.getFileUrl(image.path);
          return res.redirect(signedUrl);
        } catch (error) {
          console.error('Error getting signed URL for path:', image.path, error);
          return res.status(404).json({ message: "Failed to get image URL" });
        }
      }
      
      // If it's already a full HTTP URL, redirect to it
      if (image.path && image.path.startsWith('http')) {
        return res.redirect(image.path);
      }

      // Otherwise, try to serve from local storage
      let filePath: string = "";
      let fileExists = false;

      if (image.path) {
        // Try absolute path first
        if (path.isAbsolute(image.path)) {
          filePath = image.path;
        } else {
          // Try relative to current working directory
          filePath = path.join(process.cwd(), image.path);
        }
        
        if (fs.existsSync(filePath)) {
          fileExists = true;
        } else {
          // Try relative to uploads directory
          filePath = path.join(process.cwd(), "uploads", path.basename(image.path));
          if (fs.existsSync(filePath)) {
            fileExists = true;
          }
        }
      }

      if (!fileExists || !filePath) {
        return res.status(404).json({ message: "Image file not found" });
      }

      // Determine content type based on file extension
      const fileExtension = path.extname(filePath).toLowerCase();
      let contentType = "image/jpeg"; // default
      if (fileExtension === ".png") contentType = "image/png";
      else if (fileExtension === ".jpg" || fileExtension === ".jpeg") contentType = "image/jpeg";
      else if (fileExtension === ".gif") contentType = "image/gif";
      else if (fileExtension === ".webp") contentType = "image/webp";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
      res.sendFile(filePath);
    } catch (error) {
      console.error("Error serving image:", error);
      res.status(500).json({ message: "Failed to serve image" });
    }
  });

  app.post("/api/plans", upload.single('file'), async (req, res) => {
    const storage = getStorage();
    try {
      const planData = insertPlanSchema.parse(req.body);
      if (req.file) {
        const fileContent = fs.readFileSync(req.file.path);
        planData.content = fileContent.toString("base64");
        planData.fileName = req.file.originalname;
        planData.fileSize = req.file.size;
        fs.unlinkSync(req.file.path); // Clean up uploaded file
      }
      
      // Get user ID from request (assuming it's set by authentication middleware)
      // For now, using a default user ID if not authenticated
      const userId = (req as any).user?.id || "default-user-id";
      
      const newPlan = await storage.createPlan(planData, userId);
      res.status(201).json(newPlan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid plan data", details: error.errors });
      }
      res.status(500).json({ message: "Error creating plan" });
    }
  });

  app.put("/api/plans/:id", async (req, res) => {
    const storage = getStorage();
    try {
      const updates = req.body;
      const updatedPlan = await storage.updatePlan(req.params.id, updates);
      if (updatedPlan) {
        res.json(updatedPlan);
      } else {
        res.status(404).json({ message: "Plan not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error updating plan" });
    }
  });

  app.delete("/api/plans/:id", async (req, res) => {
    const storage = getStorage();
    await storage.deletePlan(req.params.id);
    res.status(204).send();
  });

  app.get("/api/plans/:id/download", async (req, res) => {
    try {
      const storage = getStorage();
      const plan = await storage.getPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      // Increment download count first, regardless of file source
      await storage.incrementDownloadCount(plan.id.toString());

      // Try multiple path resolution strategies
      let filePath: string = "";
      let fileExists = false;

      // Strategy 1: Use file_url if available (Supabase Storage)
      if (plan.file_url) {
        console.log("Using file_url:", plan.file_url);
        try {
          // Always generate a fresh signed URL to avoid expiration issues
          let signedUrl: string;
          if (plan.file_url.includes('supabase.co')) {
            // Extract the file path from the existing signed URL
            const urlParts = plan.file_url.split('/object/sign/')[1];
            const filePath = urlParts ? urlParts.split('?')[0] : plan.file_url;
            signedUrl = await storage.getFileUrl(filePath);
          } else {
            // It's just a filename, get signed URL from Supabase Storage
            signedUrl = await storage.getFileUrl(plan.file_url);
          }
          
          // Fetch the file from Supabase Storage
          const response = await fetch(signedUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
          }
          
          // Use plan title as filename, sanitized for file system compatibility
          const sanitizedTitle = plan.title
            ? plan.title.replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '_')
            : null;
          const fileName = sanitizedTitle || plan.fileName || 'plan.pdf';
          
          // Determine content type based on file extension
          const fileExtension = plan.fileName ? path.extname(plan.fileName).toLowerCase() : '.pdf';
          let contentType = "application/pdf";
          if (fileExtension === ".png") contentType = "image/png";
          else if (fileExtension === ".jpg" || fileExtension === ".jpeg") contentType = "image/jpeg";
          else if (fileExtension === ".gif") contentType = "image/gif";

          // Set proper headers for download
          res.setHeader("Content-Type", contentType);
          res.setHeader("Content-Disposition", `attachment; filename="${fileName}${fileExtension}"`);
          res.setHeader("Cache-Control", "no-cache");
          
          // Stream the file to the client
          const fileBuffer = await response.arrayBuffer();
          return res.send(Buffer.from(fileBuffer));
        } catch (error) {
          console.error("Error fetching file from Supabase Storage:", error);
          // Fall through to local file strategies
        }
      }

      // Strategy 2: Try the stored filePath
      if (plan.filePath) {
        const originalPath = plan.filePath;
        console.log("Original file path from DB:", originalPath);
        
        // Try absolute path first
        if (path.isAbsolute(originalPath)) {
          filePath = originalPath;
        } else {
          // Try relative to current working directory
          filePath = path.join(process.cwd(), originalPath);
        }
        
        console.log("Trying file path:", filePath);
        if (fs.existsSync(filePath)) {
          fileExists = true;
        } else {
          // Try relative to uploads directory
          filePath = path.join(process.cwd(), "uploads", path.basename(originalPath));
          console.log("Trying uploads directory:", filePath);
          if (fs.existsSync(filePath)) {
            fileExists = true;
          }
        }
      }

      if (!fileExists || !filePath) {
        console.error("File not found at any attempted path");
        return res.status(404).json({ message: "File not found" });
      }

      // Use plan title as filename, sanitized for file system compatibility
      const sanitizedTitle = plan.title
        ? plan.title.replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '_')
        : null;
      const fileName = sanitizedTitle || plan.fileName || 'plan.pdf';

      // Determine content type based on file extension
      const fileExtension = path.extname(filePath).toLowerCase();
      let contentType = "application/pdf";
      if (fileExtension === ".png") contentType = "image/png";
      else if (fileExtension === ".jpg" || fileExtension === ".jpeg") contentType = "image/jpeg";
      else if (fileExtension === ".gif") contentType = "image/gif";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}${fileExtension}"`);
      res.sendFile(filePath);
    } catch (error) {
      console.error("Error downloading plan:", error);
      res.status(500).json({ message: "Failed to download plan" });
    }
  });

  const server = createServer(app);
  return server;
}
