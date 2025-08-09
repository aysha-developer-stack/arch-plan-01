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
  
  // Metadata
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
  
  // Metadata
  status: { type: String, default: "active", maxlength: 20 },
  downloadCount: { type: Number, default: 0 },
  uploadedBy: String,
}, {
  timestamps: true,
});

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
  planType: z.string().max(100),
  storeys: z.number(),
  lotSize: z.string().max(50).optional(),
  orientation: z.string().max(50).optional(),
  siteType: z.string().max(100).optional(),
  foundationType: z.string().max(100).optional(),
  councilArea: z.string().max(100).optional(),
  status: z.string().max(20).optional(),
  uploadedBy: z.string().optional(),
});

export type UpsertUser = z.infer<typeof insertUserSchema>;
export type UserType = IUser;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type PlanType = IPlan;
