import { z } from "zod";
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
export interface IPlan {
    id: string;
    title: string;
    description?: string;
    architect?: string;
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
export declare const insertUserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    profileImageUrl: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["pending", "approved", "rejected"]>>;
    rejectionReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    profileImageUrl?: string | undefined;
    status?: "pending" | "approved" | "rejected" | undefined;
    rejectionReason?: string | undefined;
}, {
    id: string;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    profileImageUrl?: string | undefined;
    status?: "pending" | "approved" | "rejected" | undefined;
    rejectionReason?: string | undefined;
}>;
export declare const insertPlanSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    architect: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodNumber>;
    fileName: z.ZodString;
    filePath: z.ZodString;
    fileSize: z.ZodNumber;
    images: z.ZodOptional<z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        filename: z.ZodString;
        size: z.ZodNumber;
        fileId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        filename: string;
        size: number;
        fileId?: string | undefined;
    }, {
        path: string;
        filename: string;
        size: number;
        fileId?: string | undefined;
    }>, "many">>;
    planType: z.ZodString;
    storeys: z.ZodNumber;
    lotSize: z.ZodOptional<z.ZodString>;
    orientation: z.ZodOptional<z.ZodString>;
    siteType: z.ZodOptional<z.ZodString>;
    foundationType: z.ZodOptional<z.ZodString>;
    councilArea: z.ZodOptional<z.ZodString>;
    plotLength: z.ZodOptional<z.ZodNumber>;
    plotWidth: z.ZodOptional<z.ZodNumber>;
    coveredArea: z.ZodOptional<z.ZodNumber>;
    roadPosition: z.ZodOptional<z.ZodString>;
    builderName: z.ZodOptional<z.ZodString>;
    jobAddress: z.ZodOptional<z.ZodString>;
    houseType: z.ZodOptional<z.ZodString>;
    bedrooms: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    toilets: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    livingAreas: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    numberOfUnits: z.ZodOptional<z.ZodNumber>;
    constructionType: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    lotSizeMin: z.ZodOptional<z.ZodNumber>;
    lotSizeMax: z.ZodOptional<z.ZodNumber>;
    totalBuildingHeight: z.ZodOptional<z.ZodNumber>;
    roofPitch: z.ZodOptional<z.ZodNumber>;
    outdoorFeatures: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    indoorFeatures: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    status: z.ZodOptional<z.ZodString>;
    uploadedBy: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    planType: string;
    storeys: number;
    bedrooms: number;
    toilets: number;
    livingAreas: number;
    status?: string | undefined;
    description?: string | undefined;
    architect?: string | undefined;
    images?: {
        path: string;
        filename: string;
        size: number;
        fileId?: string | undefined;
    }[] | undefined;
    lotSize?: string | undefined;
    orientation?: string | undefined;
    siteType?: string | undefined;
    foundationType?: string | undefined;
    councilArea?: string | undefined;
    plotLength?: number | undefined;
    plotWidth?: number | undefined;
    coveredArea?: number | undefined;
    roadPosition?: string | undefined;
    builderName?: string | undefined;
    jobAddress?: string | undefined;
    houseType?: string | undefined;
    numberOfUnits?: number | undefined;
    constructionType?: string[] | undefined;
    lotSizeMin?: number | undefined;
    lotSizeMax?: number | undefined;
    totalBuildingHeight?: number | undefined;
    roofPitch?: number | undefined;
    outdoorFeatures?: string[] | undefined;
    indoorFeatures?: string[] | undefined;
    uploadedBy?: string | undefined;
    year?: number | undefined;
}, {
    title: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    planType: string;
    storeys: number;
    status?: string | undefined;
    description?: string | undefined;
    architect?: string | undefined;
    images?: {
        path: string;
        filename: string;
        size: number;
        fileId?: string | undefined;
    }[] | undefined;
    lotSize?: string | undefined;
    orientation?: string | undefined;
    siteType?: string | undefined;
    foundationType?: string | undefined;
    councilArea?: string | undefined;
    plotLength?: number | undefined;
    plotWidth?: number | undefined;
    coveredArea?: number | undefined;
    roadPosition?: string | undefined;
    builderName?: string | undefined;
    jobAddress?: string | undefined;
    houseType?: string | undefined;
    bedrooms?: number | undefined;
    toilets?: number | undefined;
    livingAreas?: number | undefined;
    numberOfUnits?: number | undefined;
    constructionType?: string[] | undefined;
    lotSizeMin?: number | undefined;
    lotSizeMax?: number | undefined;
    totalBuildingHeight?: number | undefined;
    roofPitch?: number | undefined;
    outdoorFeatures?: string[] | undefined;
    indoorFeatures?: string[] | undefined;
    uploadedBy?: string | undefined;
    year?: number | undefined;
}>;
export declare const appUserSignupSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    password: string;
}, {
    email: string;
    name: string;
    password: string;
}>;
export declare const appUserLoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const appUserApprovalSchema: z.ZodObject<{
    userId: z.ZodString;
    action: z.ZodEnum<["approve", "reject"]>;
    rejectionReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    action: "approve" | "reject";
    rejectionReason?: string | undefined;
}, {
    userId: string;
    action: "approve" | "reject";
    rejectionReason?: string | undefined;
}>;
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type UserType = IUser;
export type AppUserType = IAppUser;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type PlanType = IPlan;
//# sourceMappingURL=schema.d.ts.map