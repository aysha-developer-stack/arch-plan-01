import { z } from "zod";
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
//# sourceMappingURL=schema.js.map