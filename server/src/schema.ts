import mongoose, { Schema, Document } from 'mongoose';
import { z } from "zod";

// User interface and schema
export interface IUser extends Document {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  firstName: String,
  lastName: String,
  profileImageUrl: String,
  downloadCount: { type: Number, default: 0 },
}, {
  timestamps: true,
});

export const User = mongoose.model<IUser>('User', userSchema);

// Plan interface and schema
export interface IPlan extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  content?: string; // Base64 encoded file content
  
  // Plan characteristics
  planType: string;
  storeys: number;
  lotSize?: string;
  orientation?: string;
  siteType?: string;
  foundationType?: string;
  councilArea?: string;
  
  // Additional plan details
  plotLength?: number; // Plot length in meters
  plotWidth?: number; // Plot width in meters
  coveredArea?: number; // Covered area in square meters
  roadPosition?: string; // Length Side, Width Side, Corner Plot
  builderName?: string; // Builder or designer name
  houseType?: string; // Single Dwelling, Duplex, Townhouse, Unit
  bedrooms?: number; // Number of bedrooms
  toilets?: number; // Number of toilets/bathrooms
  livingAreas?: number; // Number of living spaces
  constructionType?: string[]; // Array of construction types: Hebel, Cladding, Brick, NRG
  
  // Additional features and specifications
  lotSizeMin?: number; // Minimum lot size in square meters
  lotSizeMax?: number; // Maximum lot size in square meters
  totalBuildingHeight?: number; // Total building height in meters
  roofPitch?: number; // Roof pitch in degrees
  outdoorFeatures?: string[]; // Array of outdoor features
  indoorFeatures?: string[]; // Array of indoor features
  extractedKeywords?: string[]; // Auto-extracted keywords from description
  
  // Status and metadata
  status: string;
  downloadCount: number;
  uploadedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>({
  title: { type: String, required: true, maxlength: 255 },
  description: String,
  fileName: { type: String, required: true, maxlength: 255 },
  filePath: { type: String, required: true, maxlength: 500 },
  fileSize: { type: Number, required: true },
  content: String, // Base64 encoded file content
  
  // Plan characteristics
  planType: { type: String, required: true, maxlength: 100 },
  storeys: { type: Number, required: true },
  lotSize: { type: String, maxlength: 50 },
  orientation: { type: String, maxlength: 50 },
  siteType: { type: String, maxlength: 100 },
  foundationType: { type: String, maxlength: 100 },
  councilArea: { type: String, maxlength: 100 },
  
  // Additional plan details
  plotLength: { type: Number }, // Plot length in meters
  plotWidth: { type: Number }, // Plot width in meters
  coveredArea: { type: Number }, // Covered area in square meters
  roadPosition: { type: String, maxlength: 50 }, // Length Side, Width Side, Corner Plot
  builderName: { type: String, maxlength: 255 }, // Builder or designer name
  houseType: { type: String, maxlength: 50 }, // Single Dwelling, Duplex, Townhouse, Unit
  bedrooms: { type: Number, default: 3 }, // Number of bedrooms
  toilets: { type: Number, default: 2 }, // Number of toilets/bathrooms
  livingAreas: { type: Number, default: 1 }, // Number of living spaces
  constructionType: [{ type: String }], // Array of construction types: Hebel, Cladding, Brick, NRG
  
  // Additional features and specifications
  lotSizeMin: { type: Number }, // Minimum lot size in square meters
  lotSizeMax: { type: Number }, // Maximum lot size in square meters
  totalBuildingHeight: { type: Number }, // Total building height in meters
  roofPitch: { type: Number }, // Roof pitch in degrees
  outdoorFeatures: [{ type: String }], // Array of outdoor features
  indoorFeatures: [{ type: String }], // Array of indoor features
  extractedKeywords: [{ type: String }], // Auto-extracted keywords from description
  
  // Status and metadata
  status: { type: String, default: "active", maxlength: 20 },
  downloadCount: { type: Number, default: 0 },
  uploadedBy: String,
}, {
  timestamps: true,
});

// Add indexes for better search performance
planSchema.index({ title: 'text', description: 'text', builderName: 'text' }); // Text search index
planSchema.index({ planType: 1 }); // Plan type filter
planSchema.index({ storeys: 1 }); // Storeys filter
planSchema.index({ lotSize: 1 }); // Lot size filter
planSchema.index({ orientation: 1 }); // Orientation filter
planSchema.index({ siteType: 1 }); // Site type filter
planSchema.index({ foundationType: 1 }); // Foundation type filter
planSchema.index({ councilArea: 1 }); // Council area filter
planSchema.index({ status: 1 }); // Status filter (active/inactive)
planSchema.index({ createdAt: -1 }); // Sort by creation date
planSchema.index({ downloadCount: -1 }); // Sort by popularity
planSchema.index({ bedrooms: 1 }); // Bedrooms filter
planSchema.index({ houseType: 1 }); // House type filter
planSchema.index({ extractedKeywords: 1 }); // Keywords search
planSchema.index({ lotSizeMin: 1, lotSizeMax: 1 }); // Lot size range
planSchema.index({ plotLength: 1, plotWidth: 1 }); // Plot dimensions
planSchema.index({ coveredArea: 1 }); // Covered area
planSchema.index({ roadPosition: 1 }); // Road position
planSchema.index({ constructionType: 1 }); // Construction type array
planSchema.index({ outdoorFeatures: 1 }); // Outdoor features array
planSchema.index({ indoorFeatures: 1 }); // Indoor features array

// Compound indexes for common filter combinations
planSchema.index({ status: 1, planType: 1, storeys: 1 }); // Common filters together
planSchema.index({ status: 1, createdAt: -1 }); // Active plans by date
planSchema.index({ status: 1, downloadCount: -1 }); // Popular active plans

export const Plan = mongoose.model<IPlan>('Plan', planSchema);

// Zod schemas for validation
export const insertUserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().optional(),
});

export const insertPlanSchema = z.object({
  title: z.string().max(255),
  description: z.string().optional(),
  fileName: z.string().max(255),
  filePath: z.string().max(500),
  fileSize: z.number(),
  content: z.string().optional(), // Base64 encoded file content
  planType: z.string().max(100),
  storeys: z.number(),
  lotSize: z.string().max(50).optional(),
  orientation: z.string().max(50).optional(),
  siteType: z.string().max(100).optional(),
  foundationType: z.string().max(100).optional(),
  councilArea: z.string().max(100).optional(),
  
  // Additional plan details
  plotLength: z.number().optional(), // Plot length in meters
  plotWidth: z.number().optional(), // Plot width in meters
  coveredArea: z.number().optional(), // Covered area in square meters
  roadPosition: z.string().max(50).optional(), // Length Side, Width Side, Corner Plot
  builderName: z.string().max(255).optional(), // Builder or designer name
  houseType: z.string().max(50).optional(), // Single Dwelling, Duplex, Townhouse, Unit
  bedrooms: z.number().min(0).optional().default(3), // Number of bedrooms
  toilets: z.number().min(0).optional().default(2), // Number of toilets/bathrooms
  livingAreas: z.number().min(0).optional().default(1), // Number of living spaces
  constructionType: z.array(z.string()).optional(), // Array of construction types
  lotSizeMin: z.number().optional(), // Minimum lot size in square meters
  lotSizeMax: z.number().optional(), // Maximum lot size in square meters
  totalBuildingHeight: z.number().optional(), // Total building height in meters
  roofPitch: z.number().optional(), // Roof pitch in degrees
  outdoorFeatures: z.array(z.string()).optional(), // Array of outdoor features
  indoorFeatures: z.array(z.string()).optional(), // Array of indoor features
  extractedKeywords: z.array(z.string()).optional(), // Auto-extracted keywords from description
  
  status: z.string().max(20).optional(),
  uploadedBy: z.string().optional(),
});

// Search interface schema for plan search
export const searchPlanSchema = z.object({
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
  totalBuildingHeight: z.string().optional(),
  roofPitch: z.string().optional(),
  outdoorFeatures: z.string().optional(),
  indoorFeatures: z.string().optional(),
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type UpsertUser = z.infer<typeof insertUserSchema>;
export type UserType = IUser;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type PlanType = IPlan;
export type SearchPlan = z.infer<typeof searchPlanSchema>;
