
import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { insertPlanSchema, searchPlanSchema } from "./src/schema.js";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  type UserType,
  type UpsertUser,
  type PlanType,
  type InsertPlan,
} from "./src/schema.js";
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

export interface IStorage {
  // User operations
  getUser(id: string): Promise<UserType | null>;
  upsertUser(user: UpsertUser): Promise<UserType>;
  incrementUserDownloadCount(userId: string): Promise<void>;

  // Plan operations
  searchPlans(filters: PlanFilters): Promise<{ plans: PlanType[]; total: number }>;
  getPlan(id: string, excludeContent?: boolean): Promise<PlanType | null>;
  createPlan(plan: InsertPlan, userId?: string): Promise<PlanType>;
  updatePlan(id: string, updates: Partial<InsertPlan>): Promise<PlanType | null>;
  deletePlan(id: string): Promise<void>;
  incrementDownloadCount(id: string): Promise<void>;
  getRecentPlans(limit?: number): Promise<PlanType[]>;
  getPlanStats(): Promise<PlanStats>;

  // File operations
  uploadFile(file: Buffer, fileName: string): Promise<string>;
  getFileUrl(filePath: string): Promise<string>;
  deleteFile(filePath: string): Promise<void>;
}

export interface PlanFilters {
  keyword?: string;
  lotSize?: string;
  lotSizeMin?: string;
  lotSizeMax?: string;
  orientation?: string;
  siteType?: string;
  foundationType?: string;
  storeys?: string;
  councilArea?: string;
  search?: string;
  bedrooms?: string;
  houseType?: string;
  constructionType?: string;
  planType?: string;
  plotLength?: string;
  plotWidth?: string;
  coveredArea?: string;
  roadPosition?: string;
  builderName?: string;
  jobAddress?: string;
  toilets?: string;
  livingAreas?: string;
  totalBuildingHeight?: string;
  roofPitch?: string;
  outdoorFeatures?: string;
  indoorFeatures?: string;
  numberOfUnits?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PlanStats {
  totalPlans: number;
  totalDownloads: number;
  recentUploads: number;
}

export class SupabaseStorage implements IStorage {
  private BUCKET_NAME = 'plan-files';

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      // Check if the bucket exists, if not create it
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.error('Error listing buckets:', listError);
        throw new Error(`Failed to list Supabase buckets: ${listError.message}`);
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);

      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: false,
          fileSizeLimit: 100 * 1024 * 1024, // 100MB - matching Multer configuration
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/zip']
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
          // Don't throw error, just log it and continue
          console.log(`Continuing without bucket creation. Bucket may already exist or need manual creation.`);
        } else {
          console.log(`Bucket '${this.BUCKET_NAME}' created successfully`);
        }
      }
    } catch (error) {
      console.error('Error initializing Supabase Storage:', error);
      // Continue execution even if bucket creation fails
      // The application can still function without file storage
    }
  }

  async getUser(id: string): Promise<UserType | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.error("Error getting user:", error);
      return null;
    }
    return data as UserType;
  }

  async upsertUser(userData: UpsertUser): Promise<UserType> {
    const { data, error } = await supabase
      .from("users")
      .upsert(userData)
      .select()
      .single();
    if (error) {
      console.error("Error upserting user:", error);
      throw error;
    }
    return data as UserType;
  }

  async incrementUserDownloadCount(userId: string): Promise<void> {
    const { error } = await supabase.rpc("increment_user_download_count", {
      user_id: userId,
    });
    if (error) {
      console.error("Error incrementing user download count:", error);
    }
  }

  async searchPlans(
    filters: PlanFilters
  ): Promise<{ plans: PlanType[]; total: number }> {
    console.log('🔍 Search filters received:', JSON.stringify(filters, null, 2));
    let query = supabase.from("plans").select("*", { count: "exact" });

    // Check if any filter (excluding limit/offset/sort) is active
    const hasFilters = Object.entries(filters).some(([key, value]) =>
      !['limit', 'offset', 'sortBy', 'sortOrder'].includes(key) &&
      value !== undefined && value !== null && value !== '' &&
      (!Array.isArray(value) || value.length > 0)
    );

    if (!hasFilters) {
      console.log('🔍 No major filters applied, executing base query.');
      // Continue to execute with only pagination/sorting if no filters present
    }

    // --- FIX APPLIED HERE: Using chained .filter() for AND logic on features ---

    // 1. Add keyword conditions (still using OR logic for title/description)
    if (filters.keyword) {
      console.log('🔍 Adding keyword filter:', filters.keyword);
      const keywordCondition = `title.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%`;
      query = query.or(keywordCondition);
    }

    // 2. Add outdoor feature conditions (AND logic: plan must have ALL selected)
    if (filters.outdoorFeatures) {
      console.log('🔍 Processing outdoor features:', filters.outdoorFeatures);
      const outdoorFeaturesList = filters.outdoorFeatures.split(',').map(f => f.trim()).filter(f => f);
      if (outdoorFeaturesList.length > 0) {
        outdoorFeaturesList.forEach(feature => {
          // Each filter chains, enforcing AND logic
          query = query.filter('outdoorFeatures', 'cs', [feature]);
        });
        console.log('✅ Added outdoor conditions (AND logic)');
      }
    }

    // 3. Add indoor feature conditions (AND logic: plan must have ALL selected)  
    if (filters.indoorFeatures) {
      console.log('🔍 Processing indoor features:', filters.indoorFeatures);
      const indoorFeaturesList = filters.indoorFeatures.split(',').map(f => f.trim()).filter(f => f);
      if (indoorFeaturesList.length > 0) {
        indoorFeaturesList.forEach(feature => {
          // Each filter chains, enforcing AND logic
          query = query.filter('indoorFeatures', 'cs', [feature]);
        });
        console.log('✅ Added indoor conditions (AND logic)');
      }
    }

    // --- Rest of the Filters (EQ logic) ---

    if (filters.planType) {
      query = query.eq('building_type', filters.planType);
    }

    if (filters.storeys) {
      query = query.eq('storeys', parseInt(filters.storeys));
    }

    if (filters.bedrooms) {
      query = query.eq('bedrooms', parseInt(filters.bedrooms));
    }

    if (filters.toilets) {
      query = query.eq('toilets', parseInt(filters.toilets));
    }

    if (filters.livingAreas) {
      query = query.eq('livingAreas', parseInt(filters.livingAreas));
    }

    if (filters.orientation) {
      query = query.eq('orientation', filters.orientation);
    }

    if (filters.siteType) {
      query = query.eq('siteType', filters.siteType);
    }

    if (filters.foundationType) {
      query = query.eq('foundationType', filters.foundationType);
    }

    if (filters.councilArea) {
      query = query.eq('councilArea', filters.councilArea);
    }

    if (filters.houseType) {
      query = query.eq('houseType', filters.houseType);
    }

    if (filters.roadPosition) {
      query = query.eq('roadPosition', filters.roadPosition);
    }

    // Lot size range filtering
    if (filters.lotSizeMin && filters.lotSizeMax) {
      const minSize = parseFloat(filters.lotSizeMin);
      const maxSize = parseFloat(filters.lotSizeMax);
      // Use lotSizeMin and lotSizeMax fields for range filtering
      query = query.gte('lotSizeMin', minSize).lte('lotSizeMax', maxSize);
    }

    // --- Sorting and Pagination ---

    if (filters.sortBy) {
      query = query.order(filters.sortBy, {
        ascending: filters.sortOrder === "asc",
      });
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 0) - 1);
    }

    console.log('🔍 Executing query...');
    const { data, error, count } = await query;

    if (error) {
      console.error("❌ Error searching plans:", error);
      return { plans: [], total: 0 };
    }

    console.log('✅ Search results:', { plansFound: data?.length || 0, totalCount: count || 0 });
    console.log('🔍 First few plans:', data?.slice(0, 2)?.map(p => ({ id: p.id, title: p.title, outdoorFeatures: p.outdoorFeatures })));

    return { plans: (data as PlanType[]) || [], total: count || 0 };
  }

  async getPlan(id: string, excludeContent: boolean = false): Promise<PlanType | null> {
    let query = supabase.from("plans").select("*");
    if (excludeContent) {
      query = supabase.from("plans").select(`*, content:content_excluded`);
    }
    const { data, error } = await query.eq("id", id).single();

    if (error) {
      console.error("Error getting plan:", error);
      return null;
    }

    // If the plan has a file_url, get a signed URL for it
    if (data && data.file_url) {
      try {
        const fileUrl = await this.getFileUrl(data.file_url);
        data.file_url = fileUrl;
      } catch (err) {
        console.error('Error getting signed URL for plan file:', err);
      }
    }

    return data as PlanType;
  }

  async createPlan(plan: InsertPlan, userId?: string): Promise<PlanType> {
    // If the plan has content as base64, upload it to Supabase Storage
    if (plan.content && plan.fileName) {
      try {
        const buffer = Buffer.from(plan.content, 'base64');
        const filePath = await this.uploadFile(buffer, plan.fileName);

        // Replace the content with the file URL
        plan.file_url = filePath;
        delete plan.content;
      } catch (err) {
        console.error('Error uploading plan file:', err);
      }
    }

    // Ensure building_type is never null before database insertion
    const planWithBuildingType = plan as InsertPlan & {
      building_type?: string;
      keywords?: string[];
      download_count?: number;
      view_count?: number;
      created_by?: string;
    };
    if (!planWithBuildingType.building_type) {
      if (plan.planType) {
        planWithBuildingType.building_type = plan.planType;
      } else {
        planWithBuildingType.building_type = "Residential"; // Default value
      }
    }

    // Ensure keywords field is provided (required by database)
    if (!planWithBuildingType.keywords) {
      planWithBuildingType.keywords = [];
    }

    // Ensure download_count and view_count are provided (required by database)
    if (planWithBuildingType.download_count === undefined) {
      planWithBuildingType.download_count = 0;
    }
    if (planWithBuildingType.view_count === undefined) {
      planWithBuildingType.view_count = 0;
    }

    // Ensure created_by is provided (required by database)
    if (userId) {
      planWithBuildingType.created_by = userId;
    } else if (!planWithBuildingType.created_by) {
      // If no userId provided and no created_by in plan, this will cause an error
      // In production, you should always provide a userId
      throw new Error("created_by is required - please provide a userId parameter");
    }

    const { data, error } = await supabase
      .from("plans")
      .insert(planWithBuildingType)
      .select()
      .single();
    if (error) {
      console.error("Error creating plan:", error);
      throw error;
    }
    return data as PlanType;
  }

  async updatePlan(
    id: string,
    updates: Partial<InsertPlan>
  ): Promise<PlanType | null> {
    // If the plan update includes new content, upload it to Supabase Storage
    if (updates.content && updates.fileName) {
      try {
        // Get the existing plan to check if we need to delete an old file
        const existingPlan = await this.getPlan(id);
        if (existingPlan && existingPlan.file_url) {
          await this.deleteFile(existingPlan.file_url);
        }

        const buffer = Buffer.from(updates.content, 'base64');
        const filePath = await this.uploadFile(buffer, updates.fileName);

        // Replace the content with the file URL
        updates.file_url = filePath;
        delete updates.content;
      } catch (err) {
        console.error('Error updating plan file:', err);
      }
    }

    const { data, error } = await supabase
      .from("plans")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error("Error updating plan:", error);
      return null;
    }
    return data as PlanType;
  }

  async deletePlan(id: string): Promise<void> {
    // Get the plan to check if we need to delete a file
    const plan = await this.getPlan(id);
    if (plan && plan.file_url) {
      await this.deleteFile(plan.file_url);
    }

    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) {
      console.error("Error deleting plan:", error);
    }
  }

  async incrementDownloadCount(id: string): Promise<void> {
    // First get the current count
    const { data: currentPlan, error: fetchError } = await supabase
      .from("plans")
      .select("download_count")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching current download count:", fetchError);
      return;
    }

    // Then update with incremented value
    const { error } = await supabase
      .from("plans")
      .update({
        download_count: (currentPlan.download_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      console.error("Error incrementing plan download count:", error);
    }
  }

  async getRecentPlans(limit: number = 10): Promise<PlanType[]> {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("Error getting recent plans:", error);
      throw error;
    }
    return data as PlanType[];
  }

  async getPlanStats(): Promise<PlanStats> {
    const { data, error } = await supabase.rpc("get_plan_stats");
    if (error) {
      console.error("Error getting plan stats:", error);
      return { totalPlans: 0, totalDownloads: 0, recentUploads: 0 };
    }

    // The Supabase function returns an array with one object containing snake_case fields
    // We need to extract the first element and convert to camelCase
    if (Array.isArray(data) && data.length > 0) {
      const stats = data[0];
      return {
        totalPlans: stats.total_plans || 0,
        totalDownloads: stats.total_downloads || 0,
        recentUploads: stats.recent_uploads || 0
      };
    }

    return { totalPlans: 0, totalDownloads: 0, recentUploads: 0 };
  }

  // File operations using Supabase Storage

  async uploadFile(file: Buffer, fileName: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}-${fileName}`;
      const filePath = `${uniqueFileName}`;

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          contentType: this.getContentType(fileName),
          upsert: false
        });

      if (error) {
        console.error('Error uploading file:', error);
        throw error;
      }

      return filePath;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getFileUrl(filePath: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

      if (error) {
        console.error('Error getting file URL:', error);
        throw error;
      }

      if (!data || !data.signedUrl) {
        throw new Error('Failed to create signed URL: No data returned');
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error in getFileUrl:', error);
      throw new Error(`Failed to get file URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteFile:', error);
      // Don't throw error for delete operations to prevent cascading failures
      // Just log the error and continue
    }
  }

  private getContentType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      default:
        return 'application/octet-stream';
    }
  }
}

let storage: IStorage | null = null;

export function getStorage(): IStorage {
  if (!storage) {
    storage = new SupabaseStorage();
  }
  return storage;
}

export function initializeStorage(): void {
  if (!storage) {
    storage = new SupabaseStorage();
  }
}

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
      
      // Handle array parameters for features - convert arrays to comma-separated strings
      if (filters.outdoorFeatures) {
        if (Array.isArray(filters.outdoorFeatures)) {
          filters.outdoorFeatures = filters.outdoorFeatures.join(',');
        }
      }
      
      if (filters.indoorFeatures) {
        if (Array.isArray(filters.indoorFeatures)) {
          filters.indoorFeatures = filters.indoorFeatures.join(',');
        }
      }
      
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
      const image = plan.images?.find((img: any) => img.fileId === req.params.fileId);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // If it's a Supabase Storage URL, redirect to it
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
        return res.redirect(plan.file_url);
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
