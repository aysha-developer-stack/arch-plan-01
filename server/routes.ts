import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage.js";
import { insertPlanSchema, searchPlanSchema } from "./src/schema.js";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { supabase } from "./db.js";

// Import user and admin routes
import userRoutes from "./src/routes/userRoutes.js";
import adminUserRoutes from "./src/routes/adminUserRoutes.js";
import adminRoutes from "./src/routes/adminroutes.js";

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
  // Register user routes
  app.use('/api/users', userRoutes);
  
  // Register admin user management routes
  app.use('/api/admin/users', adminUserRoutes);
  
  // Register admin routes
  app.use('/api/admin', adminRoutes);

  // Mock auth endpoint for development
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    const mockUser = {
      id: "admin",
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    res.json(mockUser);
  });

  // Search plans endpoint
  app.get("/api/plans/search", async (req: Request, res: Response) => {
    try {
      const storage = getStorage();
      const filters = {
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
        jobAddress: req.query.jobAddress as string,
        toilets: req.query.toilets as string,
        livingAreas: req.query.livingAreas as string,
        totalBuildingHeight: req.query.totalBuildingHeight as string,
        roofPitch: req.query.roofPitch as string,
        outdoorFeatures: req.query.outdoorFeatures as string | string[],
        indoorFeatures: req.query.indoorFeatures as string | string[],
        numberOfUnits: req.query.numberOfUnits as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as "asc" | "desc",
      };

      const plans = await storage.searchPlans(filters);
      res.json(plans);
    } catch (error) {
      console.error("Error searching plans:", error);
      res.status(500).json({ message: "Failed to search plans" });
    }
  });

  // Get single plan endpoint
  app.get("/api/plans/:id", async (req: Request, res: Response) => {
    try {
      const storage = getStorage();
      const plan = await storage.getPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching plan:", error);
      res.status(500).json({ message: "Failed to fetch plan" });
    }
  });

  // Download plan endpoint
  app.get("/api/plans/:id/download", async (req: Request, res: Response) => {
    try {
      const storage = getStorage();
      const planId = req.params.id;
      
      // 1. Get the plan's data from the database
      const plan = await storage.getPlan(planId);
      if (!plan || !plan.filePath) {
        return res.status(404).json({ message: "Plan not found or missing file path" });
      }

      // 2. Increment download count
      await storage.incrementDownloadCount(plan.id.toString());
      
      // 3. Get the file's content directly from Supabase Storage
      const { data: fileBlob, error: storageError } = await supabase.storage
        .from('plan-files') // Make sure this is your bucket name
        .download(plan.filePath); // Use the exact file path from the database

      if (storageError) {
        console.error(`Error downloading from Supabase:`, storageError);
        return res.status(404).json({ 
          message: "File not found in storage",
          details: storageError.message 
        });
      }

      // 4. Sanitize filename and set headers for download
      const sanitizedTitle = plan.title
        ? plan.title.replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '_')
        : 'plan';
      const fileExtension = path.extname(plan.filePath);
      const fileName = `${sanitizedTitle}${fileExtension}`;
      const contentType = fileBlob.type;
      
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      
      // 5. Send the file to the client
      const fileBuffer = await fileBlob.arrayBuffer();
      return res.send(Buffer.from(fileBuffer));
      
    } catch (error) {
      console.error(`Error in download endpoint for plan ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to download plan",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get recent plans endpoint
  app.get("/api/plans/recent", async (req: Request, res: Response) => {
    try {
      const storage = getStorage();
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const plans = await storage.getRecentPlans(limit);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching recent plans:", error);
      res.status(500).json({ message: "Failed to fetch recent plans" });
    }
  });

  // Get plan statistics endpoint
  app.get("/api/plans/stats", async (req: Request, res: Response) => {
    try {
      const storage = getStorage();
      const stats = await storage.getPlanStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching plan stats:", error);
      res.status(500).json({ message: "Failed to fetch plan statistics" });
    }
  });

  const server = createServer(app);
  return server;
}