import mongoose, { Schema, Document } from 'mongoose';
import { z } from "zod";
import bcrypt from 'bcryptjs';

// User interface and schema (for Replit integration and file downloads)
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
  collection: 'replit_users' // Different collection name to avoid conflicts
});

export const User = mongoose.model<IUser>('ReplitUser', userSchema);

// AppUser interface and schema (for user authentication system)
export interface IAppUser extends Document {
  email: string;
  password: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvedAt?: Date;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const appUserSchema = new Schema<IAppUser>({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String },
  approvedAt: { type: Date },
  approvedBy: { type: String }
}, {
  timestamps: true,
});

// Hash password before saving
appUserSchema.pre<IAppUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password comparison method
appUserSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const AppUser = mongoose.models.AppUser || mongoose.model<IAppUser>('AppUser', appUserSchema, 'appusers');

// Plan interface and schema
export interface IPlan extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileId?: mongoose.Types.ObjectId; // GridFS file ID for large file storage
  content?: string; // Legacy base64 content for backward compatibility
  images?: Array<{
    path: string;
    filename: string;
    size: number;
    fileId?: mongoose.Types.ObjectId; // GridFS file ID for image storage
  }>; // Array of image files associated with the plan
  
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
  jobAddress?: string; // Job address or location
  houseType?: string; // Single Dwelling, Duplex, Townhouse, Unit
  bedrooms?: number; // Number of bedrooms
  toilets?: number; // Number of toilets/bathrooms
  livingAreas?: number; // Number of living spaces
  numberOfUnits?: number; // Number of units
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
  fileId: { type: Schema.Types.ObjectId }, // GridFS file ID for large file storage
  content: { type: String }, // Legacy base64 content for backward compatibility
  images: [{
    path: { type: String, required: true },
    filename: { type: String, required: true },
    size: { type: Number, required: true },
    fileId: { type: Schema.Types.ObjectId } // GridFS file ID for image storage
  }], // Array of image files associated with the plan
  
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
  jobAddress: { type: String, maxlength: 500 }, // Job address or location
  houseType: { type: String, maxlength: 50 }, // Single Dwelling, Duplex, Townhouse, Unit
  bedrooms: { type: Number, default: 3 }, // Number of bedrooms
  toilets: { type: Number, default: 2 }, // Number of toilets/bathrooms
  livingAreas: { type: Number, default: 1 }, // Number of living spaces
  numberOfUnits: { type: Number }, // Number of units
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

export const Plan = mongoose.models.Plan || mongoose.model<IPlan>('Plan', planSchema);

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
  fileId: z.instanceof(mongoose.Types.ObjectId).optional(), // GridFS file ID for large file storage
  content: z.string().optional(), // Legacy base64 content for backward compatibility
  images: z.array(z.object({
    path: z.string(),
    filename: z.string(),
    size: z.number(),
    fileId: z.instanceof(mongoose.Types.ObjectId).optional() // GridFS file ID for image storage
  })).optional(),
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
  jobAddress: z.string().max(500).optional(), // Job address or location
  houseType: z.string().max(50).optional(), // Single Dwelling, Duplex, Townhouse, Unit
  bedrooms: z.number().min(0).optional().default(3), // Number of bedrooms
  toilets: z.number().min(0).optional().default(2), // Number of toilets/bathrooms
  livingAreas: z.number().min(0).optional().default(1), // Number of living spaces
  numberOfUnits: z.number().optional(), // Number of units
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
  numberOfUnits: z.string().optional(),
  jobAddress: z.string().optional(),
  totalBuildingHeight: z.string().optional(),
  roofPitch: z.string().optional(),
  outdoorFeatures: z.string().optional(),
  indoorFeatures: z.string().optional(),
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// AppUser validation schemas
export const appUserSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1)
});

export const appUserLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const appUserApprovalSchema = z.object({
  userId: z.string(),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional()
});

export type UpsertUser = z.infer<typeof insertUserSchema>;
export type UserType = IUser;
export type AppUserType = IAppUser;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type PlanType = IPlan;
export type SearchPlan = z.infer<typeof searchPlanSchema>;
