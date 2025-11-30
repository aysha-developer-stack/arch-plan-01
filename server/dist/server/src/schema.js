import { z } from "zod";
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
    architect: z.string().max(255).optional(), // Architect or designer name
    fileName: z.string().max(255),
    filePath: z.string().max(500),
    fileSize: z.number(),
    fileId: z.string().optional(), // GridFS file ID for large file storage
    content: z.string().optional(), // Legacy base64 content for backward compatibility
    file_url: z.string().optional(), // URL to the file in Supabase Storage
    images: z.array(z.object({
        path: z.string(),
        filename: z.string(),
        size: z.number(),
        fileId: z.string().optional() // GridFS file ID for image storage
    })).optional(),
    planType: z.string().max(100),
    building_type: z.string().max(100).optional(), // Type of building (Residential, Commercial, etc.)
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
//# sourceMappingURL=schema.js.map