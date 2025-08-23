import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "../../server/storage";
import { insertPlanSchema } from "../../shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const storage = getStorage();

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

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/auth/user", async (req: any, res) => {
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

  app.get("/api/plans/search", async (req, res) => {
    try {
      const filters = {
        lotSize: req.query.lotSize as string,
        orientation: req.query.orientation as string,
        siteType: req.query.siteType as string,
        foundationType: req.query.foundationType as string,
        storeys: req.query.storeys as string,
        councilArea: req.query.councilArea as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const plans = await storage.searchPlans(filters);
      res.json(plans);
    } catch (error) {
      console.error("Error searching plans:", error);
      res.status(500).json({ message: "Failed to search plans" });
    }
  });

  app.get("/api/plans/:id", async (req, res) => {
    try {
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

  app.get("/api/plans/:id/download", async (req, res) => {
    try {
      const plan = await storage.getPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      let filePath = path.isAbsolute(plan.filePath)
        ? plan.filePath
        : path.join(process.cwd(), plan.filePath);

      console.log("Looking for file at:", filePath);

      if (!fs.existsSync(filePath)) {
        console.error("File not found at path:", filePath);
        return res.status(404).json({ message: "File not found" });
      }

      await storage.incrementDownloadCount(plan._id.toString());

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=\"${plan.fileName}\"`);
      res.sendFile(filePath);
    } catch (error) {
      console.error("Error downloading plan:", error);
      res.status(500).json({ message: "Failed to download plan" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getPlanStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/plans", async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };
      const plans = await storage.searchPlans(filters);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching admin plans:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  app.post("/api/admin/plans", upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = "Admin";
      const relativePath = path.relative(process.cwd(), req.file.path);

      const planData = insertPlanSchema.parse({
        ...req.body,
        fileName: req.file.originalname,
        filePath: relativePath,
        fileSize: req.file.size,
        uploadedBy: userId,
        bedrooms: req.body.bedrooms ? parseInt(req.body.bedrooms) : null,
        storeys: parseInt(req.body.storeys),
      });

      const plan = await storage.createPlan(planData);
      res.json(plan);
    } catch (error) {
      console.error("Error uploading plan:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid plan data", errors: error.issues });
      }
      res.status(500).json({ message: "Failed to upload plan" });
    }
  });

  app.put("/api/admin/plans/:id", async (req, res) => {
    try {
      const updates = insertPlanSchema.partial().parse(req.body);
      const plan = await storage.updatePlan(req.params.id, updates);
      res.json(plan);
    } catch (error) {
      console.error("Error updating plan:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid plan data", errors: error.issues });
      }
      res.status(500).json({ message: "Failed to update plan" });
    }
  });

  app.delete("/api/admin/plans/:id", async (req, res) => {
    try {
      const plan = await storage.getPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      const filePath = path.isAbsolute(plan.filePath)
        ? plan.filePath
        : path.join(process.cwd(), plan.filePath);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await storage.deletePlan(req.params.id);
      res.json({ message: "Plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting plan:", error);
      res.status(500).json({ message: "Failed to delete plan" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
