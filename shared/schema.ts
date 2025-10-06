import { z } from "zod";

// User interface
export interface IUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  downloadCount: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// AppUser interface (for user authentication system)
export interface IAppUser {
  id: string;
  email: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Plan interface
export interface IPlan {
  id: string;
  title: string;
  description?: string;
  architect?: string; // Architect or designer name

  fileName: string;
  filePath: string;
  fileSize: number;
  images?: Array<{
    path: string;
    filename: string;
    size: number;
    fileId?: string;
  }>;
  planType: string;
  storeys: number;
  lotSize?: string;
  orientation?: string;
  siteType?: string;
  foundationType?: string;
  councilArea?: string;
  plotLength?: number;
  plotLengthMin?: number;
  plotLengthMax?: number;
  plotWidth?: number;
  coveredArea?: number;
  roadPosition?: string;
  builderName?: string;
  jobAddress?: string;
  houseType?: string;
  bedrooms?: number;
  toilets?: number;
  livingAreas?: number;
  numberOfUnits?: number;
  constructionType?: string[];
  lotSizeMin?: number;
  lotSizeMax?: number;
  totalBuildingHeight?: number;
  roofPitch?: number;
  outdoorFeatures?: string[];
  indoorFeatures?: string[];
  status: string;
  downloadCount: number;
  uploadedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Zod schemas for validation
export const insertUserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  rejectionReason: z.string().optional(),
});

export const insertPlanSchema = z.object({
  title: z.string().max(255),
  description: z.string().optional(),
  architect: z.string().max(255).optional(), // Architect or designer name
  year: z.number().optional(),
  fileName: z.string().max(255),
  filePath: z.string().max(500),
  fileSize: z.number(),
  images: z.array(z.object({
    path: z.string(),
    filename: z.string(),
    size: z.number(),
    fileId: z.string().optional()
  })).optional(),
  planType: z.string().max(100),
  storeys: z.number(),
  lotSize: z.string().max(50).optional(),
  orientation: z.string().max(50).optional(),
  siteType: z.string().max(100).optional(),
  foundationType: z.string().max(100).optional(),
  councilArea: z.string().max(100).optional(),
  plotLength: z.number().optional(),
  plotLengthMin: z.number().optional(),
  plotLengthMax: z.number().optional(),
  plotWidth: z.number().optional(),
  coveredArea: z.number().optional(),
  roadPosition: z.string().max(50).optional(),
  builderName: z.string().max(255).optional(),
  jobAddress: z.string().max(500).optional(),
  houseType: z.string().max(50).optional(),
  bedrooms: z.number().min(0).optional().default(3),
  toilets: z.number().min(0).optional().default(2),
  livingAreas: z.number().min(0).optional().default(1),
  numberOfUnits: z.number().min(0).optional(),
  constructionType: z.array(z.string()).optional(),
  lotSizeMin: z.number().optional(),
  lotSizeMax: z.number().optional(),
  totalBuildingHeight: z.number().optional(),
  roofPitch: z.number().optional(),
  outdoorFeatures: z.array(z.string()).optional(),
  indoorFeatures: z.array(z.string()).optional(),
  status: z.string().max(20).optional(),
  uploadedBy: z.string().optional(),
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
