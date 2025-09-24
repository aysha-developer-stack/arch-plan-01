// server/index.ts
import dotenv3 from "dotenv";
import path5 from "path";
import { fileURLToPath as fileURLToPath4 } from "url";
import express3 from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import compression from "compression";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// server/db.ts
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../../../.env") });
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("\u274C Supabase URL or Service Role Key not set in environment variables.");
  process.exit(1);
}
var supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3e4);
      return fetch(url, {
        ...options,
        signal: controller.signal
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    }
  },
  db: {
    schema: "public"
  }
});

// server/storage.ts
var SupabaseStorage = class {
  BUCKET_NAME = "plan-files";
  constructor() {
    this.initializeStorage();
  }
  async initializeStorage() {
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      if (listError) {
        console.error("Error listing buckets:", listError);
        throw new Error(`Failed to list Supabase buckets: ${listError.message}`);
      }
      const bucketExists = buckets?.some((bucket) => bucket.name === this.BUCKET_NAME);
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: false,
          fileSizeLimit: 50 * 1024 * 1024,
          // 50MB - reduced from 100MB
          allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/gif", "application/zip"]
        });
        if (createError) {
          console.error("Error creating bucket:", createError);
          console.log(`Continuing without bucket creation. Bucket may already exist or need manual creation.`);
        } else {
          console.log(`Bucket '${this.BUCKET_NAME}' created successfully`);
        }
      }
    } catch (error) {
      console.error("Error initializing Supabase Storage:", error);
    }
  }
  async getUser(id) {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).single();
    if (error) {
      console.error("Error getting user:", error);
      return null;
    }
    return data;
  }
  async upsertUser(userData) {
    const { data, error } = await supabase.from("users").upsert(userData).select().single();
    if (error) {
      console.error("Error upserting user:", error);
      throw error;
    }
    return data;
  }
  async incrementUserDownloadCount(userId) {
    const { error } = await supabase.rpc("increment_user_download_count", {
      user_id: userId
    });
    if (error) {
      console.error("Error incrementing user download count:", error);
    }
  }
  async searchPlans(filters) {
    let query = supabase.from("plans").select("*", { count: "exact" });
    if (filters.keyword) {
      query = query.or(
        `title.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%`
      );
    }
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,builderName.ilike.%${filters.search}%`
      );
    }
    if (filters.lotSize) {
      query = query.eq("lotSize", filters.lotSize);
    }
    if (filters.orientation) {
      query = query.eq("orientation", filters.orientation);
    }
    if (filters.siteType) {
      query = query.eq("siteType", filters.siteType);
    }
    if (filters.foundationType) {
      query = query.eq("foundationType", filters.foundationType);
    }
    if (filters.storeys) {
      query = query.eq("storeys", parseInt(filters.storeys));
    }
    if (filters.councilArea) {
      query = query.eq("councilArea", filters.councilArea);
    }
    if (filters.bedrooms) {
      query = query.eq("bedrooms", parseInt(filters.bedrooms));
    }
    if (filters.houseType) {
      query = query.eq("houseType", filters.houseType);
    }
    if (filters.planType) {
      query = query.eq("planType", filters.planType);
    }
    if (filters.builderName) {
      query = query.ilike("builderName", `%${filters.builderName}%`);
    }
    if (filters.jobAddress) {
      query = query.ilike("jobAddress", `%${filters.jobAddress}%`);
    }
    if (filters.toilets) {
      query = query.eq("toilets", parseInt(filters.toilets));
    }
    if (filters.livingAreas) {
      query = query.eq("livingAreas", parseInt(filters.livingAreas));
    }
    if (filters.numberOfUnits) {
      query = query.eq("numberOfUnits", parseInt(filters.numberOfUnits));
    }
    if (filters.outdoorFeatures) {
      const features = Array.isArray(filters.outdoorFeatures) ? filters.outdoorFeatures : [filters.outdoorFeatures];
      if (features.length > 0) {
        query = query.contains("outdoorFeatures", features);
      }
    }
    if (filters.indoorFeatures) {
      const features = Array.isArray(filters.indoorFeatures) ? filters.indoorFeatures : [filters.indoorFeatures];
      if (features.length > 0) {
        query = query.contains("indoorFeatures", features);
      }
    }
    if (filters.sortBy) {
      query = query.order(filters.sortBy, {
        ascending: filters.sortOrder === "asc"
      });
    } else {
      query = query.order("created_at", { ascending: false });
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 0) - 1);
    }
    const { data, error, count } = await query;
    if (error) {
      console.error("Error searching plans:", error);
      return { plans: [], total: 0 };
    }
    return { plans: data || [], total: count || 0 };
  }
  async getPlan(id, excludeContent = false) {
    let query = supabase.from("plans").select("*");
    if (excludeContent) {
      query = supabase.from("plans").select(`*, content:content_excluded`);
    }
    const { data, error } = await query.eq("id", id).single();
    if (error) {
      console.error("Error getting plan:", error);
      return null;
    }
    if (data && data.file_url) {
      try {
        const fileUrl = await this.getFileUrl(data.file_url);
        data.file_url = fileUrl;
      } catch (err) {
        console.error("Error getting signed URL for plan file:", err);
      }
    }
    return data;
  }
  async createPlan(plan, userId) {
    if (plan.content && plan.fileName) {
      try {
        const buffer = Buffer.from(plan.content, "base64");
        const filePath = await this.uploadFile(buffer, plan.fileName);
        plan.file_url = filePath;
        delete plan.content;
      } catch (err) {
        console.error("Error uploading plan file:", err);
      }
    }
    const planWithBuildingType = plan;
    if (!planWithBuildingType.building_type) {
      if (plan.planType) {
        planWithBuildingType.building_type = plan.planType;
      } else {
        planWithBuildingType.building_type = "Residential";
      }
    }
    if (!planWithBuildingType.keywords) {
      planWithBuildingType.keywords = [];
    }
    if (planWithBuildingType.download_count === void 0) {
      planWithBuildingType.download_count = 0;
    }
    if (planWithBuildingType.view_count === void 0) {
      planWithBuildingType.view_count = 0;
    }
    if (userId) {
      planWithBuildingType.created_by = userId;
    } else if (!planWithBuildingType.created_by) {
      throw new Error("created_by is required - please provide a userId parameter");
    }
    const { data, error } = await supabase.from("plans").insert(planWithBuildingType).select().single();
    if (error) {
      console.error("Error creating plan:", error);
      throw error;
    }
    return data;
  }
  async updatePlan(id, updates) {
    if (updates.content && updates.fileName) {
      try {
        const existingPlan = await this.getPlan(id);
        if (existingPlan && existingPlan.file_url) {
          await this.deleteFile(existingPlan.file_url);
        }
        const buffer = Buffer.from(updates.content, "base64");
        const filePath = await this.uploadFile(buffer, updates.fileName);
        updates.file_url = filePath;
        delete updates.content;
      } catch (err) {
        console.error("Error updating plan file:", err);
      }
    }
    const { data, error } = await supabase.from("plans").update(updates).eq("id", id).select().single();
    if (error) {
      console.error("Error updating plan:", error);
      return null;
    }
    return data;
  }
  async deletePlan(id) {
    const plan = await this.getPlan(id);
    if (plan && plan.file_url) {
      await this.deleteFile(plan.file_url);
    }
    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) {
      console.error("Error deleting plan:", error);
    }
  }
  async incrementDownloadCount(id) {
    const { data: currentPlan, error: fetchError } = await supabase.from("plans").select("download_count").eq("id", id).single();
    if (fetchError) {
      console.error("Error fetching current download count:", fetchError);
      return;
    }
    const { error } = await supabase.from("plans").update({
      download_count: (currentPlan.download_count || 0) + 1,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id);
    if (error) {
      console.error("Error incrementing plan download count:", error);
    }
  }
  async getRecentPlans(limit = 10) {
    const { data, error } = await supabase.from("plans").select("*").order("created_at", { ascending: false }).limit(limit);
    if (error) {
      console.error("Error getting recent plans:", error);
      throw error;
    }
    return data;
  }
  async getPlanStats() {
    const { data, error } = await supabase.rpc("get_plan_stats");
    if (error) {
      console.error("Error getting plan stats:", error);
      return { totalPlans: 0, totalDownloads: 0, recentUploads: 0 };
    }
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
  async uploadFile(file, fileName) {
    try {
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}-${fileName}`;
      const filePath = `${uniqueFileName}`;
      const { error } = await supabase.storage.from(this.BUCKET_NAME).upload(filePath, file, {
        contentType: this.getContentType(fileName),
        upsert: false
      });
      if (error) {
        console.error("Error uploading file:", error);
        throw error;
      }
      return filePath;
    } catch (error) {
      console.error("Error in uploadFile:", error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async getFileUrl(filePath) {
    try {
      const { data, error } = await supabase.storage.from(this.BUCKET_NAME).createSignedUrl(filePath, 60 * 60);
      if (error) {
        console.error("Error getting file URL:", error);
        throw error;
      }
      if (!data || !data.signedUrl) {
        throw new Error("Failed to create signed URL: No data returned");
      }
      return data.signedUrl;
    } catch (error) {
      console.error("Error in getFileUrl:", error);
      throw new Error(`Failed to get file URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);
      if (error) {
        console.error("Error deleting file:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error in deleteFile:", error);
    }
  }
  getContentType(fileName) {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "application/pdf";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      default:
        return "application/octet-stream";
    }
  }
};
var storage = null;
function getStorage() {
  if (!storage) {
    storage = new SupabaseStorage();
  }
  return storage;
}

// server/src/schema.ts
import { z } from "zod";
var insertUserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().optional()
});
var insertPlanSchema = z.object({
  title: z.string().max(255),
  description: z.string().optional(),
  architect: z.string().max(255).optional(),
  // Architect or designer name
  fileName: z.string().max(255),
  filePath: z.string().max(500),
  fileSize: z.number(),
  fileId: z.string().optional(),
  // GridFS file ID for large file storage
  content: z.string().optional(),
  // Legacy base64 content for backward compatibility
  file_url: z.string().optional(),
  // URL to the file in Supabase Storage
  images: z.array(z.object({
    path: z.string(),
    filename: z.string(),
    size: z.number(),
    fileId: z.string().optional()
    // GridFS file ID for image storage
  })).optional(),
  planType: z.string().max(100),
  building_type: z.string().max(100).optional(),
  // Type of building (Residential, Commercial, etc.)
  storeys: z.number(),
  lotSize: z.string().max(50).optional(),
  orientation: z.string().max(50).optional(),
  siteType: z.string().max(100).optional(),
  foundationType: z.string().max(100).optional(),
  councilArea: z.string().max(100).optional(),
  // Additional plan details
  plotLength: z.number().optional(),
  // Plot length in meters
  plotWidth: z.number().optional(),
  // Plot width in meters
  coveredArea: z.number().optional(),
  // Covered area in square meters
  roadPosition: z.string().max(50).optional(),
  // Length Side, Width Side, Corner Plot
  builderName: z.string().max(255).optional(),
  // Builder or designer name
  jobAddress: z.string().max(500).optional(),
  // Job address or location
  houseType: z.string().max(50).optional(),
  // Single Dwelling, Duplex, Townhouse, Unit
  bedrooms: z.number().min(0).optional().default(3),
  // Number of bedrooms
  toilets: z.number().min(0).optional().default(2),
  // Number of toilets/bathrooms
  livingAreas: z.number().min(0).optional().default(1),
  // Number of living spaces
  numberOfUnits: z.number().optional(),
  // Number of units
  constructionType: z.array(z.string()).optional(),
  // Array of construction types
  lotSizeMin: z.number().optional(),
  // Minimum lot size in square meters
  lotSizeMax: z.number().optional(),
  // Maximum lot size in square meters
  totalBuildingHeight: z.number().optional(),
  // Total building height in meters
  roofPitch: z.number().optional(),
  // Roof pitch in degrees
  outdoorFeatures: z.array(z.string()).optional(),
  // Array of outdoor features
  indoorFeatures: z.array(z.string()).optional(),
  // Array of indoor features
  extractedKeywords: z.array(z.string()).optional(),
  // Auto-extracted keywords from description
  status: z.string().max(20).optional(),
  uploadedBy: z.string().optional()
});
var searchPlanSchema = z.object({
  keyword: z.string().optional(),
  lotSize: z.string().optional(),
  lotSizeMin: z.string().optional(),
  lotSizeMax: z.string().optional(),
  orientation: z.string().optional(),
  siteType: z.string().optional(),
  foundationType: z.string().optional(),
  storeys: z.string().optional(),
  councilArea: z.string().optional(),
  search: z.string().optional(),
  bedrooms: z.string().optional(),
  houseType: z.string().optional(),
  constructionType: z.string().optional(),
  planType: z.string().optional(),
  plotLength: z.string().optional(),
  plotWidth: z.string().optional(),
  coveredArea: z.string().optional(),
  roadPosition: z.string().optional(),
  builderName: z.string().optional(),
  toilets: z.string().optional(),
  livingAreas: z.string().optional(),
  numberOfUnits: z.string().optional(),
  jobAddress: z.string().optional(),
  totalBuildingHeight: z.string().optional(),
  roofPitch: z.string().optional(),
  outdoorFeatures: z.union([z.string(), z.array(z.string())]).optional(),
  indoorFeatures: z.union([z.string(), z.array(z.string())]).optional(),
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc")
});
var appUserSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1)
});
var appUserLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
var appUserApprovalSchema = z.object({
  userId: z.string(),
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().optional()
});

// server/routes.ts
import { z as z5 } from "zod";
import multer2 from "multer";
import path3 from "path";
import fs2 from "fs";
import { fileURLToPath as fileURLToPath2 } from "url";

// server/src/routes/userRoutes.ts
import { Router } from "express";

// server/src/middleware/userAuthMiddleware.ts
var authenticateUser = async (req, res, next) => {
  let token = req.cookies?.["supabase-auth-token"];
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. No token provided."
    });
  }
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please log in again."
      });
    }
    const { data: appUser, error: profileError } = await supabase.from("app_users").select("*").eq("id", user.id).single();
    if (profileError || !appUser) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please log in again."
      });
    }
    if (appUser.status !== "approved") {
      let message = "Account access denied.";
      if (appUser.status === "pending") {
        message = "Your account is awaiting admin approval.";
      } else if (appUser.status === "rejected") {
        message = appUser.rejectionReason || "Your account has been rejected. Please contact support.";
      }
      return res.status(403).json({
        success: false,
        message,
        status: appUser.status,
        rejectionReason: appUser.status === "rejected" ? appUser.rejectionReason : void 0
      });
    }
    req.userId = user.id;
    req.appUser = appUser;
    next();
  } catch (error) {
    console.error("User authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during authentication."
    });
  }
};

// server/src/routes/userRoutes.ts
import { z as z2 } from "zod";
var appUserSignupSchema2 = z2.object({
  email: z2.string().email(),
  password: z2.string().min(6),
  name: z2.string().min(2)
});
var appUserLoginSchema2 = z2.object({
  email: z2.string().email(),
  password: z2.string().min(6)
});
var router = Router();
router.post("/signup", async (req, res) => {
  try {
    const validatedData = appUserSignupSchema2.parse(req.body);
    const { email, password, name } = validatedData;
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      // Auto-confirm the email
      user_metadata: {
        name
      }
    });
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(201).json({
      success: true,
      message: "Account created successfully. You can now log in.",
      data
    });
  } catch (error) {
    console.error("Signup error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.errors
      });
    }
    res.status(500).json({ success: false, message: "Server error during signup" });
  }
});
router.post("/login", async (req, res) => {
  try {
    const validatedData = appUserLoginSchema2.parse(req.body);
    const { email, password } = validatedData;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      return res.status(401).json({ success: false, message: error.message });
    }
    const { session, user } = data;
    const { data: appUser, error: profileError } = await supabase.from("app_users").select("*").eq("id", user.id).single();
    if (profileError || !appUser) {
      return res.status(401).json({
        success: false,
        message: "User profile not found. Please contact support."
      });
    }
    if (appUser.status !== "approved") {
      let message = "Account access denied.";
      if (appUser.status === "pending") {
        message = "Your account is awaiting admin approval.";
      } else if (appUser.status === "rejected") {
        message = appUser.rejection_reason || "Your account has been rejected. Please contact support.";
      }
      return res.status(403).json({
        success: false,
        message,
        status: appUser.status,
        rejectionReason: appUser.status === "rejected" ? appUser.rejection_reason : void 0
      });
    }
    res.cookie("supabase-auth-token", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: session.expires_in * 1e3
    });
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: appUser.name,
        status: appUser.status,
        token: session.access_token,
        downloadCount: 0
        // Default value for compatibility
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.errors
      });
    }
    res.status(500).json({ success: false, message: "Server error during login" });
  }
});
router.post("/logout", async (req, res) => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
  res.clearCookie("supabase-auth-token");
  res.status(200).json({ success: true, message: "Logout successful" });
});
router.get("/me", authenticateUser, async (req, res) => {
  try {
    if (!req.appUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    res.status(200).json({
      success: true,
      user: req.appUser
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
router.get("/me/downloads", authenticateUser, async (req, res) => {
  try {
    if (!req.appUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    const downloadCount = 0;
    res.status(200).json({
      success: true,
      downloadCount
    });
  } catch (error) {
    console.error("Get user downloads error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
var userRoutes_default = router;

// server/src/routes/adminUserRoutes.ts
import { Router as Router2 } from "express";

// server/src/middleware/authMiddleware.ts
var authenticateAdmin = async (req, res, next) => {
  const token = req.cookies?.["supabase-auth-token"];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. No token provided."
    });
  }
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please log in again."
      });
    }
    if (!user.user_metadata?.is_admin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. User is not an admin."
      });
    }
    req.adminId = user.id;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during authentication."
    });
  }
};

// server/src/routes/adminUserRoutes.ts
import { z as z3 } from "zod";

// server/src/services/emailService.ts
import nodemailer from "nodemailer";

// server/src/config.ts
import dotenv2 from "dotenv";
dotenv2.config();
var config = {
  EMAIL_USER: process.env.EMAIL_USER || "",
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || "",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  PORT: process.env.PORT || 3e3,
  NODE_ENV: process.env.NODE_ENV || "development"
};
var config_default = config;

// server/src/services/emailService.ts
var EmailService = class {
  transporter;
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config_default.EMAIL_USER,
        pass: config_default.EMAIL_PASSWORD
      }
    });
  }
  async sendEmail(options) {
    try {
      const mailOptions = {
        from: `"ArchPlan" <${config_default.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html
      };
      const result = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", result.messageId);
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }
  }
  async sendApprovalEmail(userEmail, userName) {
    const subject = "Account Approved - Welcome to ArchPlan!";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #28a745; margin: 0; text-align: center;">\u{1F389} Account Approved!</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hello ${userName},</h2>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            Great news! Your ArchPlan account has been approved by our admin team. You can now access all the features and start exploring our architectural plans.
          </p>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #155724; font-weight: 500;">
              \u2705 Your account is now active and ready to use!
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            You can now log in to your account and start browsing our collection of architectural plans.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${config_default.CLIENT_URL}/login" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Login to Your Account
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px; margin-top: 30px;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            This email was sent from ArchPlan. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;
    await this.sendEmail({ to: userEmail, subject, html });
  }
  async sendRejectionEmail(userEmail, userName, rejectionReason) {
    const subject = "Account Application Update - ArchPlan";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #dc3545; margin: 0; text-align: center;">Account Application Update</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hello ${userName},</h2>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            Thank you for your interest in ArchPlan. After reviewing your account application, we regret to inform you that we cannot approve your account at this time.
          </p>
          
          <div style="background-color: #f8d7da; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <p style="margin: 0; color: #721c24; font-weight: 500;">
              <strong>Reason:</strong> ${rejectionReason}
            </p>
          </div>
          
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0066cc;">
            <p style="margin: 0; color: #004085; font-weight: 500;">
              <strong>Alternative Option:</strong> If you would like to try again, you can register again using a different email address to submit a new login request.
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            If you believe this decision was made in error or if you have additional information that might change our assessment, please feel free to contact our support team.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${config_default.EMAIL_USER}" 
               style="background-color: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Contact Support
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px; margin-top: 30px;">
            We appreciate your understanding and thank you for your interest in ArchPlan.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            This email was sent from ArchPlan. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;
    await this.sendEmail({ to: userEmail, subject, html });
  }
};
var emailService_default = new EmailService();

// server/src/routes/adminUserRoutes.ts
var appUserApprovalSchema2 = z3.object({
  userId: z3.string(),
  action: z3.enum(["approve", "reject"]),
  rejectionReason: z3.string().optional()
});
var router2 = Router2();
router2.get("/pending", authenticateAdmin, async (req, res) => {
  try {
    const { data: pendingUsers, error } = await supabase.from("app_users").select("*").eq("status", "pending");
    if (error) {
      throw error;
    }
    res.status(200).json({
      success: true,
      data: pendingUsers,
      count: pendingUsers.length
    });
  } catch (error) {
    console.error("Error fetching pending users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching pending users"
    });
  }
});
router2.get("/", authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const rangeFrom = (page - 1) * limit;
    const rangeTo = rangeFrom + limit - 1;
    let query = supabase.from("app_users").select("*", { count: "exact" });
    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    const { data: users, error, count } = await query.range(rangeFrom, rangeTo);
    if (error) {
      throw error;
    }
    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users"
    });
  }
});
router2.get("/all", authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const rangeFrom = (page - 1) * limit;
    const rangeTo = rangeFrom + limit - 1;
    let query = supabase.from("app_users").select("*", { count: "exact" });
    if (status) {
      query = query.eq("status", status);
    }
    const { data: users, error, count } = await query.range(rangeFrom, rangeTo);
    if (error) {
      throw error;
    }
    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users"
    });
  }
});
router2.post("/approve-reject", authenticateAdmin, async (req, res) => {
  try {
    const validatedData = appUserApprovalSchema2.parse(req.body);
    const { userId, action, rejectionReason } = validatedData;
    const { data: user, error: fetchError } = await supabase.from("app_users").select("*").eq("id", userId).single();
    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    if (user.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `User is already ${user.status}`
      });
    }
    const newStatus = action === "approve" ? "approved" : "rejected";
    const updateData = { status: newStatus };
    if (newStatus === "rejected") {
      updateData.rejection_reason = rejectionReason;
    }
    const { data: updatedUser, error: updateError } = await supabase.from("app_users").update(updateData).eq("id", userId).single();
    if (updateError) {
      throw updateError;
    }
    try {
      if (action === "approve") {
        await emailService_default.sendApprovalEmail(user.email, user.name);
      } else if (action === "reject") {
        await emailService_default.sendRejectionEmail(user.email, user.name, rejectionReason || "No specific reason provided");
      }
    } catch (emailError) {
      console.error("Error sending email notification:", emailError);
    }
    res.status(200).json({
      success: true,
      message: `User ${action}d successfully`,
      data: updatedUser
    });
  } catch (error) {
    console.error("Error processing user approval/rejection:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while processing request"
    });
  }
});
router2.get("/user-stats", authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.rpc("get_user_stats");
    if (error) {
      throw error;
    }
    res.status(200).json({
      success: true,
      data: data[0]
    });
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching statistics"
    });
  }
});
router2.get("/stats", authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.rpc("get_user_stats");
    if (error) {
      throw error;
    }
    res.status(200).json({
      success: true,
      data: data[0]
    });
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching statistics"
    });
  }
});
router2.delete("/bulk/all", authenticateAdmin, async (req, res) => {
  try {
    const { count: userCount, error: countError } = await supabase.from("app_users").select("*", { count: "exact", head: true });
    if (countError) {
      throw countError;
    }
    const { error } = await supabase.from("app_users").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      throw error;
    }
    res.status(200).json({
      success: true,
      message: `All ${userCount} users deleted successfully`,
      data: { deletedCount: userCount }
    });
  } catch (error) {
    console.error("Error deleting all users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting all users"
    });
  }
});
router2.delete("/:userId", authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { data: deletedUser, error } = await supabase.from("app_users").delete().eq("id", userId).single();
    if (error) {
      throw error;
    }
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: { deletedUser }
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting user"
    });
  }
});
var adminUserRoutes_default = router2;

// server/src/routes/adminroutes.ts
import { Router as Router3 } from "express";

// server/src/services/adminService.ts
async function createAdmin(email, password, name) {
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      // Auto-confirm the email
      user_metadata: {
        name,
        is_admin: true
      }
    });
    if (authError) {
      throw authError;
    }
    const { data: adminData, error: adminError } = await supabase.from("admins").select("*").eq("id", authData.user.id).single();
    if (adminError) {
      const { data: newAdmin, error: createError } = await supabase.from("admins").insert({
        id: authData.user.id,
        email: authData.user.email,
        name
      }).select().single();
      if (createError) {
        throw createError;
      }
      return newAdmin;
    }
    return adminData;
  } catch (error) {
    console.error("Error creating admin:", error);
    throw error;
  }
}
async function authenticateAdmin2(email, password) {
  const maxRetries = 3;
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Admin authentication attempt ${attempt}/${maxRetries} for ${email}`);
      const { data: authData, error: authError } = await Promise.race([
        supabase.auth.signInWithPassword({
          email,
          password
        }),
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Authentication timeout")), 15e3)
        )
      ]);
      if (authError) {
        console.error(`Authentication error on attempt ${attempt}:`, authError);
        if (authError.message?.includes("Unexpected end of JSON input") && attempt < maxRetries) {
          console.log(`Retrying authentication due to JSON parsing error...`);
          await new Promise((resolve) => setTimeout(resolve, 1e3 * attempt));
          continue;
        }
        throw authError;
      }
      if (!authData.user.user_metadata?.is_admin) {
        throw new Error("User is not an admin");
      }
      console.log(`Admin authentication successful for ${email}`);
      return {
        admin: {
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.user_metadata.name || email
        },
        session: authData.session
      };
    } catch (error) {
      lastError = error;
      console.error(`Error authenticating admin on attempt ${attempt}:`, error);
      if (attempt === maxRetries || !error.message?.includes("Unexpected end of JSON input")) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1e3 * attempt));
    }
  }
  throw lastError;
}
async function getAllAdmins() {
  try {
    const { data, error } = await supabase.from("admins").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Error getting admins:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error getting admins:", error);
    return [];
  }
}
async function deleteAdmin(id) {
  try {
    const { error } = await supabase.from("admins").delete().eq("id", id);
    if (error) {
      throw error;
    }
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
      throw authError;
    }
    return true;
  } catch (error) {
    console.error("Error deleting admin:", error);
    return false;
  }
}

// server/src/routes/adminroutes.ts
import { z as z4 } from "zod";
import multer from "multer";
import path2 from "path";
import fs from "fs";
var adminLoginSchema = z4.object({
  email: z4.string().email(),
  password: z4.string().min(6)
});
var adminCreateSchema = z4.object({
  email: z4.string().email(),
  password: z4.string().min(6),
  name: z4.string().min(2)
});
var router3 = Router3();
var upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path2.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path2.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024
    // 100MB limit
  }
});
router3.post("/login", async (req, res) => {
  try {
    const validatedData = adminLoginSchema.parse(req.body);
    const { email, password } = validatedData;
    const { admin, session } = await authenticateAdmin2(email, password);
    res.cookie("supabase-auth-token", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: session.expires_in * 1e3
    });
    res.status(200).json({
      success: true,
      message: "Login successful",
      admin
    });
  } catch (error) {
    console.error("Admin login error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.errors
      });
    }
    res.status(401).json({
      success: false,
      message: error.message || "Login failed"
    });
  }
});
router3.post("/logout", async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    res.clearCookie("supabase-auth-token");
    res.status(200).json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    console.error("Admin logout error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Logout failed"
    });
  }
});
router3.post("/create", authenticateAdmin, async (req, res) => {
  try {
    const validatedData = adminCreateSchema.parse(req.body);
    const { email, password, name } = validatedData;
    const admin = await createAdmin(email, password, name);
    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin
    });
  } catch (error) {
    console.error("Create admin error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create admin"
    });
  }
});
router3.get("/all", authenticateAdmin, async (req, res) => {
  try {
    const admins = await getAllAdmins();
    res.status(200).json({
      success: true,
      data: admins
    });
  } catch (error) {
    console.error("Get admins error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get admins"
    });
  }
});
router3.get("/check-auth", authenticateAdmin, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Authenticated",
      adminId: req.adminId
    });
  } catch (error) {
    console.error("Check auth error:", error);
    res.status(401).json({
      success: false,
      message: "Not authenticated"
    });
  }
});
router3.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.adminId) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own admin account"
      });
    }
    const success = await deleteAdmin(id);
    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Admin not found or could not be deleted"
      });
    }
    res.status(200).json({
      success: true,
      message: "Admin deleted successfully"
    });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete admin"
    });
  }
});
router3.get("/plans", authenticateAdmin, async (req, res) => {
  try {
    const storage2 = getStorage();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "created_at";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";
    const filters = {
      limit,
      offset: (page - 1) * limit,
      sortBy,
      sortOrder
    };
    const result = await storage2.searchPlans(filters);
    res.status(200).json({
      success: true,
      data: result.plans,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching admin plans:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch plans"
    });
  }
});
router3.post("/plans", authenticateAdmin, upload.fields([
  { name: "file", maxCount: 1 },
  { name: "images", maxCount: 10 }
]), async (req, res) => {
  try {
    const storage2 = getStorage();
    const files = req.files;
    const planData = { ...req.body };
    if (files?.file && files.file[0]) {
      const file = files.file[0];
      const fileContent = fs.readFileSync(file.path);
      planData.content = fileContent.toString("base64");
      planData.fileName = file.originalname;
      planData.fileSize = file.size;
      planData.filePath = path2.relative(process.cwd(), file.path);
      fs.unlinkSync(file.path);
    }
    if (files?.images && files.images.length > 0) {
      const imageObjects = [];
      for (const imageFile of files.images) {
        try {
          const fileContent = fs.readFileSync(imageFile.path);
          const supabaseFilePath = await storage2.uploadFile(fileContent, imageFile.originalname);
          const fileId = path2.basename(imageFile.filename, path2.extname(imageFile.filename));
          imageObjects.push({
            path: supabaseFilePath,
            filename: imageFile.originalname,
            size: imageFile.size,
            fileId
          });
          fs.unlinkSync(imageFile.path);
        } catch (error) {
          console.error("Error uploading image to Supabase Storage:", error);
          const relativePath = path2.relative(process.cwd(), imageFile.path);
          const fileId = path2.basename(imageFile.filename, path2.extname(imageFile.filename));
          imageObjects.push({
            path: relativePath,
            filename: imageFile.originalname,
            size: imageFile.size,
            fileId
          });
        }
      }
      planData.images = imageObjects;
    }
    if (planData.outdoorFeatures && typeof planData.outdoorFeatures === "string") {
      try {
        planData.outdoorFeatures = JSON.parse(planData.outdoorFeatures);
      } catch (e) {
        planData.outdoorFeatures = [];
      }
    }
    if (planData.indoorFeatures && typeof planData.indoorFeatures === "string") {
      try {
        planData.indoorFeatures = JSON.parse(planData.indoorFeatures);
      } catch (e) {
        planData.indoorFeatures = [];
      }
    }
    if (planData.constructionType && typeof planData.constructionType === "string") {
      planData.constructionType = [planData.constructionType];
    }
    if (planData.storeys) planData.storeys = parseInt(planData.storeys);
    if (planData.bedrooms) planData.bedrooms = parseInt(planData.bedrooms);
    if (planData.toilets) planData.toilets = parseInt(planData.toilets);
    if (planData.livingAreas) planData.livingAreas = parseInt(planData.livingAreas);
    if (planData.numberOfUnits) planData.numberOfUnits = parseInt(planData.numberOfUnits);
    if (planData.totalBuildingHeight) planData.totalBuildingHeight = parseFloat(planData.totalBuildingHeight);
    if (planData.roofPitch) planData.roofPitch = parseFloat(planData.roofPitch);
    if (planData.plotLength) planData.plotLength = parseFloat(planData.plotLength);
    if (planData.plotWidth) planData.plotWidth = parseFloat(planData.plotWidth);
    if (planData.coveredArea) planData.coveredArea = parseFloat(planData.coveredArea);
    if (planData.lotSizeMin) planData.lotSizeMin = parseFloat(planData.lotSizeMin);
    if (planData.lotSizeMax) planData.lotSizeMax = parseFloat(planData.lotSizeMax);
    planData.status = "active";
    planData.downloadCount = 0;
    planData.uploadedBy = req.adminId;
    if (planData.builderName) {
      planData.architect = planData.builderName;
    }
    if (planData.planType) {
      planData.building_type = planData.planType;
    } else {
      planData.building_type = "Residential";
    }
    if (!planData.building_type) {
      planData.building_type = "Residential";
    }
    const validatedData = insertPlanSchema.parse(planData);
    const newPlan = await storage2.createPlan(validatedData, req.adminId);
    res.status(201).json({
      success: true,
      message: "Plan uploaded successfully",
      data: newPlan
    });
  } catch (error) {
    console.error("Error uploading plan:", error);
    const files = req.files;
    if (files?.file && files.file[0]) {
      try {
        fs.unlinkSync(files.file[0].path);
      } catch (e) {
      }
    }
    if (files?.images) {
      files.images.forEach((file) => {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {
        }
      });
    }
    if (error instanceof z4.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan data",
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload plan"
    });
  }
});
router3.delete("/plans/:id", authenticateAdmin, async (req, res) => {
  try {
    const storage2 = getStorage();
    const planId = req.params.id;
    const plan = await storage2.getPlan(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }
    await storage2.deletePlan(planId);
    res.status(200).json({
      success: true,
      message: "Plan deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete plan"
    });
  }
});
router3.get("/stats", authenticateAdmin, async (req, res) => {
  try {
    const storage2 = getStorage();
    const planStats = await storage2.getPlanStats();
    const { data: userStats, error: userStatsError } = await supabase.rpc("get_user_stats");
    if (userStatsError) {
      console.error("Error getting user stats:", userStatsError);
      throw userStatsError;
    }
    const { count: adminCount, error: adminCountError } = await supabase.from("admins").select("*", { count: "exact", head: true });
    if (adminCountError) {
      console.error("Error getting admin count:", adminCountError);
      throw adminCountError;
    }
    const stats = {
      // Flatten the plan stats to match frontend expectations
      totalPlans: planStats.totalPlans,
      totalDownloads: planStats.totalDownloads,
      recentUploads: planStats.recentUploads,
      // Keep the nested structure for users and admins
      users: userStats[0] || {
        total_users: 0,
        pending_users: 0,
        approved_users: 0,
        rejected_users: 0
      },
      admins: {
        total: adminCount || 0
      }
    };
    res.json(stats);
  } catch (error) {
    console.error("Error getting admin stats:", error);
    res.status(500).json({ message: "Error getting admin statistics" });
  }
});
var adminroutes_default = router3;

// server/routes.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path3.dirname(__filename2);
var upload2 = multer2({
  storage: multer2.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path3.join(process.cwd(), "uploads");
      if (!fs2.existsSync(uploadDir)) {
        fs2.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path3.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024
    // 100MB limit
  }
});
async function registerRoutes(app2) {
  app2.use("/uploads", express.static(path3.join(process.cwd(), "uploads")));
  app2.use("/api/users", userRoutes_default);
  app2.use("/api/admin/users", adminUserRoutes_default);
  app2.use("/api/admin", adminroutes_default);
  app2.get("/api/plans", async (req, res) => {
    const storage2 = getStorage();
    try {
      const filters = searchPlanSchema.parse(req.query);
      const result = await storage2.searchPlans(filters);
      res.json(result);
    } catch (error) {
      if (error instanceof z5.ZodError) {
        return res.status(400).json({ message: "Invalid query parameters", details: error.errors });
      }
      res.status(500).json({ message: "Error searching plans" });
    }
  });
  app2.get("/api/plans/search", async (req, res) => {
    const storage2 = getStorage();
    try {
      const filters = { ...req.query };
      if (filters.limit) filters.limit = parseInt(filters.limit);
      if (filters.offset) filters.offset = parseInt(filters.offset);
      const validatedFilters = searchPlanSchema.parse(filters);
      const result = await storage2.searchPlans(validatedFilters);
      res.json(result);
    } catch (error) {
      if (error instanceof z5.ZodError) {
        return res.status(400).json({ message: "Invalid query parameters", details: error.errors });
      }
      res.status(500).json({ message: "Error searching plans" });
    }
  });
  app2.get("/api/plans/recent", async (req, res) => {
    const storage2 = getStorage();
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const plans = await storage2.getRecentPlans(limit);
    res.json(plans);
  });
  app2.get("/api/plans/stats", async (req, res) => {
    const storage2 = getStorage();
    const stats = await storage2.getPlanStats();
    res.json(stats);
  });
  app2.get("/api/plans/total-downloads", async (req, res) => {
    try {
      const storage2 = getStorage();
      const stats = await storage2.getPlanStats();
      res.json({ totalDownloads: stats.totalDownloads });
    } catch (error) {
      console.error("Error fetching total downloads:", error);
      res.status(500).json({ message: "Error fetching total downloads" });
    }
  });
  app2.get("/api/plans/:id", async (req, res) => {
    const storage2 = getStorage();
    const plan = await storage2.getPlan(req.params.id);
    if (plan) {
      res.json(plan);
    } else {
      res.status(404).json({ message: "Plan not found" });
    }
  });
  app2.get("/api/plans/:id/images/:fileId", async (req, res) => {
    try {
      const storage2 = getStorage();
      const plan = await storage2.getPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      const image = plan.images?.find((img) => img.fileId === req.params.fileId);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      if (image.path && !image.path.startsWith("http") && !image.path.includes("\\") && !image.path.includes("/uploads/")) {
        try {
          const storage3 = getStorage();
          const signedUrl = await storage3.getFileUrl(image.path);
          return res.redirect(signedUrl);
        } catch (error) {
          console.error("Error getting signed URL for path:", image.path, error);
          return res.status(404).json({ message: "Failed to get image URL" });
        }
      }
      if (image.path && image.path.startsWith("http")) {
        return res.redirect(image.path);
      }
      let filePath = "";
      let fileExists = false;
      if (image.path) {
        if (path3.isAbsolute(image.path)) {
          filePath = image.path;
        } else {
          filePath = path3.join(process.cwd(), image.path);
        }
        if (fs2.existsSync(filePath)) {
          fileExists = true;
        } else {
          filePath = path3.join(process.cwd(), "uploads", path3.basename(image.path));
          if (fs2.existsSync(filePath)) {
            fileExists = true;
          }
        }
      }
      if (!fileExists || !filePath) {
        return res.status(404).json({ message: "Image file not found" });
      }
      const fileExtension = path3.extname(filePath).toLowerCase();
      let contentType = "image/jpeg";
      if (fileExtension === ".png") contentType = "image/png";
      else if (fileExtension === ".jpg" || fileExtension === ".jpeg") contentType = "image/jpeg";
      else if (fileExtension === ".gif") contentType = "image/gif";
      else if (fileExtension === ".webp") contentType = "image/webp";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000");
      res.sendFile(filePath);
    } catch (error) {
      console.error("Error serving image:", error);
      res.status(500).json({ message: "Failed to serve image" });
    }
  });
  app2.post("/api/plans", upload2.single("file"), async (req, res) => {
    const storage2 = getStorage();
    try {
      const planData = insertPlanSchema.parse(req.body);
      if (req.file) {
        const fileContent = fs2.readFileSync(req.file.path);
        planData.content = fileContent.toString("base64");
        planData.fileName = req.file.originalname;
        planData.fileSize = req.file.size;
        fs2.unlinkSync(req.file.path);
      }
      const userId = req.user?.id || "default-user-id";
      const newPlan = await storage2.createPlan(planData, userId);
      res.status(201).json(newPlan);
    } catch (error) {
      if (error instanceof z5.ZodError) {
        return res.status(400).json({ message: "Invalid plan data", details: error.errors });
      }
      res.status(500).json({ message: "Error creating plan" });
    }
  });
  app2.put("/api/plans/:id", async (req, res) => {
    const storage2 = getStorage();
    try {
      const updates = req.body;
      const updatedPlan = await storage2.updatePlan(req.params.id, updates);
      if (updatedPlan) {
        res.json(updatedPlan);
      } else {
        res.status(404).json({ message: "Plan not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error updating plan" });
    }
  });
  app2.delete("/api/plans/:id", async (req, res) => {
    const storage2 = getStorage();
    await storage2.deletePlan(req.params.id);
    res.status(204).send();
  });
  app2.get("/api/plans/:id/download", async (req, res) => {
    try {
      const storage2 = getStorage();
      const plan = await storage2.getPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      await storage2.incrementDownloadCount(plan.id.toString());
      let filePath = "";
      let fileExists = false;
      if (plan.file_url) {
        console.log("Using file_url:", plan.file_url);
        return res.redirect(plan.file_url);
      }
      if (plan.filePath) {
        const originalPath = plan.filePath;
        console.log("Original file path from DB:", originalPath);
        if (path3.isAbsolute(originalPath)) {
          filePath = originalPath;
        } else {
          filePath = path3.join(process.cwd(), originalPath);
        }
        console.log("Trying file path:", filePath);
        if (fs2.existsSync(filePath)) {
          fileExists = true;
        } else {
          filePath = path3.join(process.cwd(), "uploads", path3.basename(originalPath));
          console.log("Trying uploads directory:", filePath);
          if (fs2.existsSync(filePath)) {
            fileExists = true;
          }
        }
      }
      if (!fileExists || !filePath) {
        console.error("File not found at any attempted path");
        return res.status(404).json({ message: "File not found" });
      }
      const sanitizedTitle = plan.title ? plan.title.replace(/[^a-zA-Z0-9\s\-_]/g, "").replace(/\s+/g, "_") : null;
      const fileName = sanitizedTitle || plan.fileName || "plan.pdf";
      const fileExtension = path3.extname(filePath).toLowerCase();
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
  const server = createServer(app2);
  return server;
}

// server/vite.ts
import express2 from "express";
import fs3 from "fs";
import path4 from "path";
import { fileURLToPath as fileURLToPath3 } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = path4.dirname(__filename3);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const viteConfig = {
    plugins: [
      // Import react plugin
      (await import("@vitejs/plugin-react")).default({
        jsxRuntime: "automatic"
      })
    ],
    root: path4.join(__dirname3, "..", "client"),
    resolve: {
      alias: {
        "@": path4.join(__dirname3, "..", "client", "src"),
        "@shared": path4.join(__dirname3, "..", "shared"),
        "@assets": path4.join(__dirname3, "..", "attached_assets")
      }
    },
    build: {
      outDir: "../server/public"
    },
    server: {
      middlewareMode: true
    }
  };
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith("/api/")) {
      console.log(`\u{1F504} Vite middleware: Skipping API route ${url}`);
      return next();
    }
    console.log(`\u{1F4C4} Vite middleware: Serving SPA for ${url}`);
    try {
      const clientTemplate = path4.resolve(
        __dirname3,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const possiblePaths = [
    path4.join(__dirname3, "..", "dist", "public"),
    // From server/dist to dist/public
    path4.join(__dirname3, "public"),
    // Direct public folder
    path4.join(__dirname3, "..", "public")
    // Parent public folder
  ];
  let distPath = "";
  let indexHtmlPath = "";
  for (const testPath of possiblePaths) {
    const indexPath = path4.join(testPath, "index.html");
    if (fs3.existsSync(indexPath)) {
      distPath = testPath;
      indexHtmlPath = indexPath;
      break;
    }
  }
  console.log(`\u{1F4E6} Attempting to serve static files from: ${distPath}`);
  console.log(`\u{1F4C4} Index.html path: ${indexHtmlPath}`);
  console.log(`\u{1F4C1} Directory exists: ${fs3.existsSync(distPath)}`);
  console.log(`\u{1F4C4} Index.html exists: ${fs3.existsSync(indexHtmlPath)}`);
  if (!distPath || !fs3.existsSync(indexHtmlPath)) {
    console.error("\u274C Could not find built frontend files!");
    console.error("   Checked paths:", possiblePaths);
    console.error("   Make sure to run the build process before starting the server.");
    app2.get("*", (req, res) => {
      if (req.originalUrl.startsWith("/api/")) {
        return res.status(404).json({ message: "API endpoint not found" });
      }
      res.status(500).send(`
        <html>
          <body>
            <h1>Build Error</h1>
            <p>Frontend build files not found. Please run the build process.</p>
            <p>Checked paths: ${possiblePaths.join(", ")}</p>
          </body>
        </html>
      `);
    });
    return;
  }
  app2.use(express2.static(distPath, {
    maxAge: "1d",
    // Cache static assets for 1 day
    etag: true
  }));
  app2.get("*", (req, res) => {
    const url = req.originalUrl;
    if (url.startsWith("/api/")) {
      console.log(`\u{1F504} Production static: Skipping API route ${url}`);
      return res.status(404).json({ message: "API endpoint not found" });
    }
    console.log(`\u{1F4C4} Production static: Serving SPA for ${url}`);
    res.sendFile(indexHtmlPath, (err) => {
      if (err) {
        console.error(`\u274C Error serving index.html for ${url}:`, err);
        res.status(500).send("Error loading application");
      }
    });
  });
}

// server/index.ts
var __filename4 = fileURLToPath4(import.meta.url);
var __dirname4 = path5.dirname(__filename4);
dotenv3.config({ path: path5.join(__dirname4, "../.env") });
var app = express3();
app.use(compression({
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) {
      return false;
    }
    return true;
  },
  level: 6,
  // Balanced compression level (1-9, 6 is default)
  threshold: 1024,
  // Only compress responses larger than 1KB
  chunkSize: 16 * 1024
  // 16KB chunks for better streaming
}));
app.use(express3.json({ limit: "200mb" }));
app.use(express3.urlencoded({ limit: "200mb", extended: false }));
app.use(cookieParser());
var normalizeOrigin = (origin) => {
  if (!origin) return origin;
  return origin.replace(/\/$/, "");
};
var baseAllowedOrigins = [
  process.env.CORS_ORIGIN,
  // Use environment variable as primary
  "https://arch-plan-01-production.up.railway.app",
  // Explicit Railway frontend URL
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
  // Vite preview mode
  "http://localhost:5000"
  // Additional dev port
].filter(Boolean);
var allowedOrigins = baseAllowedOrigins.reduce((acc, origin) => {
  const normalized = normalizeOrigin(origin);
  acc.push(normalized);
  acc.push(normalized + "/");
  return acc;
}, []);
console.log("\u{1F527} CORS Configuration:");
console.log("   CORS_ORIGIN:", process.env.CORS_ORIGIN);
console.log("   allowedOrigins:", allowedOrigins);
var validateOrigin = (origin) => {
  if (!origin) return origin;
  if (!origin.startsWith("http://") && !origin.startsWith("https://")) {
    return `https://${origin}`;
  }
  return normalizeOrigin(origin);
};
app.use("/admin", (req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.use("/api/admin", (req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = validateOrigin(origin);
    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, normalizedOrigin);
    } else {
      console.log(`CORS blocked origin: ${origin} (normalized: ${normalizedOrigin})`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Credentials",
    "Set-Cookie",
    "Cache-Control",
    "X-HTTP-Method-Override"
  ],
  exposedHeaders: [
    "Set-Cookie",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Credentials"
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.set("trust proxy", 1);
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    cors_origin: process.env.CORS_ORIGIN || "not set",
    node_env: process.env.NODE_ENV,
    port: process.env.PORT,
    uptime: process.uptime()
  });
});
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "ArchPlan Live",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});
app.use((req, res, next) => {
  const start = Date.now();
  const path6 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path6.startsWith("/api")) {
      let logLine = `${req.method} ${path6} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });
  next();
});
app.get("/api/cors-test", (req, res) => {
  res.json({
    message: "CORS is working!",
    origin: req.headers.origin,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error("Error:", message);
});
var startServer = async () => {
  try {
    const server = await registerRoutes(app);
    console.log("\u2705 API routes registered");
    if (process.env.NODE_ENV === "development") {
      console.log("\u{1F6E0}\uFE0F Setting up Vite development server...");
      await setupVite(app, server);
    } else {
      console.log("\u{1F4E6} Serving static files...");
      serveStatic(app);
    }
    console.log(`\u{1F527} Environment Debug:`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   PORT (env): ${process.env.PORT}`);
    console.log(`   Railway App URL: ${process.env.RAILWAY_PUBLIC_DOMAIN || "not set"}`);
    console.log(`   All Railway env vars:`);
    Object.keys(process.env).filter((key) => key.includes("RAILWAY") || key === "PORT").forEach((key) => console.log(`     ${key}: ${process.env[key]}`));
    console.log("RAILWAY_ENVIRONMENT:", process.env.RAILWAY_ENVIRONMENT);
    console.log("RAILWAY_PROJECT_ID:", process.env.RAILWAY_PROJECT_ID);
    console.log("RAILWAY_SERVICE_ID:", process.env.RAILWAY_SERVICE_ID);
    const PORT = parseInt(process.env.PORT || "3000", 10);
    console.log(`   PORT (final): ${PORT}`);
    if (process.env.NODE_ENV === "production") {
      server.listen(PORT, "0.0.0.0", () => {
        console.log(`\u{1F680} Server running on port ${PORT} (bound to 0.0.0.0 for Railway)`);
        console.log(`\u{1F310} Server should be accessible at: https://${process.env.RAILWAY_PUBLIC_DOMAIN || "your-app.railway.app"}`);
        console.log(`\u{1F50D} Railway Debug: Listening on 0.0.0.0:${PORT} as required by Railway proxy`);
        setTimeout(() => {
          console.log(`\u{1F493} Server health check: Still running after 5 seconds`);
        }, 5e3);
      });
    } else {
      server.listen(PORT, "localhost", () => {
        console.log(`\u{1F680} Server running on http://localhost:${PORT}`);
      });
    }
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};
startServer();
