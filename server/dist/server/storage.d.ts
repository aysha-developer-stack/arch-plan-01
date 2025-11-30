import { type UserType, type UpsertUser, type PlanType, type InsertPlan } from "./src/schema.js";
export interface IStorage {
    getUser(id: string): Promise<UserType | null>;
    upsertUser(user: UpsertUser): Promise<UserType>;
    incrementUserDownloadCount(userId: string): Promise<void>;
    searchPlans(filters: PlanFilters): Promise<{
        plans: PlanType[];
        total: number;
    }>;
    getPlan(id: string, excludeContent?: boolean): Promise<PlanType | null>;
    createPlan(plan: InsertPlan, userId?: string): Promise<PlanType>;
    updatePlan(id: string, updates: Partial<InsertPlan>): Promise<PlanType | null>;
    deletePlan(id: string): Promise<void>;
    incrementDownloadCount(id: string): Promise<void>;
    getRecentPlans(limit?: number): Promise<PlanType[]>;
    getPlanStats(): Promise<PlanStats>;
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
export declare class SupabaseStorage implements IStorage {
    private BUCKET_NAME;
    constructor();
    private initializeStorage;
    getUser(id: string): Promise<UserType | null>;
    upsertUser(userData: UpsertUser): Promise<UserType>;
    incrementUserDownloadCount(userId: string): Promise<void>;
    searchPlans(filters: PlanFilters): Promise<{
        plans: PlanType[];
        total: number;
    }>;
    getPlan(id: string, excludeContent?: boolean): Promise<PlanType | null>;
    createPlan(plan: InsertPlan, userId?: string): Promise<PlanType>;
    updatePlan(id: string, updates: Partial<InsertPlan>): Promise<PlanType | null>;
    deletePlan(id: string): Promise<void>;
    incrementDownloadCount(id: string): Promise<void>;
    getRecentPlans(limit?: number): Promise<PlanType[]>;
    getPlanStats(): Promise<PlanStats>;
    uploadFile(file: Buffer, fileName: string): Promise<string>;
    getFileUrl(filePath: string): Promise<string>;
    deleteFile(filePath: string): Promise<void>;
    private getContentType;
}
export declare function getStorage(): IStorage;
export declare function initializeStorage(): void;
//# sourceMappingURL=storage.d.ts.map