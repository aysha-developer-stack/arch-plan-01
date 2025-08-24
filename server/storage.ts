import {
  User,
  Plan,
  type UserType,
  type UpsertUser,
  type PlanType,
  type InsertPlan,
} from "./src/schema.js";
import { extractKeywordsFromDescription } from "./src/utils/keywordExtractor.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Ensure environment variables are loaded
dotenv.config();

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<UserType | null>;
  upsertUser(user: UpsertUser): Promise<UserType>;
  incrementUserDownloadCount(userId: string): Promise<void>;

  // Plan operations
  searchPlans(filters: PlanFilters): Promise<{plans: PlanType[], total: number}>;
  getPlan(id: string, excludeContent?: boolean): Promise<PlanType | null>;
  getPlanAndIncrementDownload(id: string, excludeContent?: boolean): Promise<PlanType | null>;
  createPlan(plan: InsertPlan): Promise<PlanType>;
  updatePlan(id: string, updates: Partial<InsertPlan>): Promise<PlanType | null>;
  deletePlan(id: string): Promise<void>;
  incrementDownloadCount(id: string): Promise<void>;
  resetDownloadCount(id: string): Promise<void>;
  getRecentPlans(limit?: number): Promise<PlanType[]>;
  getPlanStats(): Promise<PlanStats>;
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
  toilets?: string;
  livingAreas?: string;
  totalBuildingHeight?: string;
  roofPitch?: string;
  outdoorFeatures?: string;
  indoorFeatures?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PlanStats {
  totalPlans: number;
  totalDownloads: number;
  recentUploads: number;
}

// In-memory storage fallback
export class MemoryStorage implements IStorage {
  private users: Map<string, UserType> = new Map();
  private plans: Map<string, PlanType> = new Map();
  private nextId = 1;

  async incrementUserDownloadCount(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.downloadCount = (user.downloadCount || 0) + 1;
      this.users.set(userId, user);
    }
  }

  async getUser(id: string): Promise<UserType | null> {
    return this.users.get(id) || null;
  }

  async upsertUser(userData: UpsertUser): Promise<UserType> {
    const existing = this.users.get(userData.id);
    const user = {
      ...existing,
      ...userData,
      updatedAt: new Date(),
      createdAt: existing?.createdAt || new Date(),
    } as UserType;
    this.users.set(userData.id, user);
    return user;
  }

  async searchPlans(filters: PlanFilters): Promise<{plans: PlanType[], total: number}> {
    let results = Array.from(this.plans.values()).filter(plan => plan.status === "active");

    if (filters.lotSize && filters.lotSize !== "Any Size") {
      results = results.filter(plan => plan.lotSize === filters.lotSize);
    }

    if (filters.orientation && filters.orientation !== "Any Orientation") {
      results = results.filter(plan => plan.orientation === filters.orientation);
    }

    if (filters.siteType && filters.siteType !== "Any Type") {
      results = results.filter(plan => plan.siteType === filters.siteType);
    }

    if (filters.foundationType && filters.foundationType !== "Any Foundation") {
      results = results.filter(plan => plan.foundationType === filters.foundationType);
    }

    if (filters.storeys && filters.storeys !== "Any") {
      const storeyMap: Record<string, number> = {
        "Single Storey": 1,
        "Two Storey": 2,
        "Three+ Storey": 3,
      };
      const storeyNumber = storeyMap[filters.storeys];
      if (storeyNumber) {
        if (storeyNumber === 3) {
          results = results.filter(plan => plan.storeys >= 3);
        } else {
          results = results.filter(plan => plan.storeys === storeyNumber);
        }
      }
    }

    if (filters.councilArea && filters.councilArea !== "Any Council") {
      results = results.filter(plan => plan.councilArea === filters.councilArea);
    }

    // Handle keyword search (searches across multiple fields including extracted keywords)
    if (filters.keyword) {
      const keywordLower = filters.keyword.toLowerCase();
      results = results.filter(plan => 
        plan.title.toLowerCase().includes(keywordLower) ||
        (plan.description && plan.description.toLowerCase().includes(keywordLower)) ||
        (plan.builderName && plan.builderName.toLowerCase().includes(keywordLower)) ||
        (plan.extractedKeywords && plan.extractedKeywords.some(keyword => 
          keyword.toLowerCase().includes(keywordLower)
        ))
      );
    }

    // Handle general search (legacy support)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(plan => 
        plan.title.toLowerCase().includes(searchLower) ||
        (plan.description && plan.description.toLowerCase().includes(searchLower)) ||
        (plan.builderName && plan.builderName.toLowerCase().includes(searchLower)) ||
        (plan.extractedKeywords && plan.extractedKeywords.some(keyword => 
          keyword.toLowerCase().includes(searchLower)
        ))
      );
    }

    if (filters.bedrooms && filters.bedrooms !== "Any") {
      if (filters.bedrooms === "5+") {
        results = results.filter(plan => (plan.bedrooms || 0) >= 5);
      } else {
        const bedroomCount = parseInt(filters.bedrooms || "0");
        results = results.filter(plan => plan.bedrooms === bedroomCount);
      }
    }

    if (filters.houseType && filters.houseType !== "Any Type") {
      results = results.filter(plan => plan.houseType === filters.houseType);
    }

    if (filters.constructionType && filters.constructionType !== "Any Construction") {
      results = results.filter(plan => 
        plan.constructionType && plan.constructionType.includes(filters.constructionType!)
      );
    }

    // Determine sort field and order
    const sortField = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    
    results.sort((a, b) => {
      let valueA: any, valueB: any;
      
      // Handle different field types
      if (sortField === 'createdAt' || sortField === 'updatedAt') {
        valueA = new Date(a[sortField as keyof PlanType] as string).getTime();
        valueB = new Date(b[sortField as keyof PlanType] as string).getTime();
      } else if (sortField === 'downloadCount' || sortField === 'storeys') {
        valueA = (a[sortField as keyof PlanType] as number) || 0;
        valueB = (b[sortField as keyof PlanType] as number) || 0;
      } else {
        valueA = String((a[sortField as keyof PlanType] as string) || '').toLowerCase();
        valueB = String((b[sortField as keyof PlanType] as string) || '').toLowerCase();
      }
      
      // Compare based on sort order
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortOrder * valueA.localeCompare(valueB);
      } else {
        return sortOrder * (valueA > valueB ? 1 : valueA < valueB ? -1 : 0);
      }
    });

    // Get total count before pagination
    const total = results.length;

    // Apply pagination
    if (filters.offset) {
      results = results.slice(filters.offset);
    }

    if (filters.limit) {
      results = results.slice(0, filters.limit);
    }

    return { plans: results, total };
  }

  async getPlan(id: string, excludeContent: boolean = false): Promise<PlanType | null> {
    const plan = this.plans.get(id) || null;
    if (plan && excludeContent) {
      const { content, ...planWithoutContent } = plan;
      return planWithoutContent as PlanType;
    }
    return plan;
  }

  async getPlanAndIncrementDownload(id: string, excludeContent: boolean = false): Promise<PlanType | null> {
    const plan = this.plans.get(id);
    if (plan) {
      plan.downloadCount = (plan.downloadCount || 0) + 1;
      if (excludeContent) {
        const { content, ...planWithoutContent } = plan;
        return planWithoutContent as PlanType;
      }
      return plan;
    }
    return null;
  }

  async createPlan(planData: InsertPlan): Promise<PlanType> {
    const id = (this.nextId++).toString();
    
    // Extract keywords from description if provided
    let extractedKeywords: string[] = [];
    if (planData.description) {
      const keywordResult = extractKeywordsFromDescription(planData.description);
      extractedKeywords = keywordResult.keywords;
      console.log(`🔍 Extracted ${extractedKeywords.length} keywords from description: ${extractedKeywords.join(', ')}`);
    }
    
    const plan = {
      _id: id as any,
      ...planData,
      extractedKeywords,
      status: planData.status || "active",
      downloadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PlanType;
    this.plans.set(id, plan);
    return plan;
  }

  async updatePlan(id: string, updates: Partial<InsertPlan>): Promise<PlanType | null> {
    const existing = this.plans.get(id);
    if (!existing) return null;
    
    // Extract keywords from description if it's being updated
    let updateData = { ...updates };
    if (updates.description) {
      const keywordResult = extractKeywordsFromDescription(updates.description);
      updateData.extractedKeywords = keywordResult.keywords;
      console.log(`🔍 Updated extracted keywords: ${keywordResult.keywords.join(', ')}`);
    }
    
    const updated = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    } as PlanType;
    this.plans.set(id, updated);
    return updated;
  }

  async deletePlan(id: string): Promise<void> {
    this.plans.delete(id);
  }

  async incrementDownloadCount(id: string): Promise<void> {
    const plan = this.plans.get(id);
    if (plan) {
      plan.downloadCount = (plan.downloadCount || 0) + 1;
      this.plans.set(id, plan);
    }
  }

  async resetDownloadCount(id: string): Promise<void> {
    const plan = this.plans.get(id);
    if (plan) {
      plan.downloadCount = 0;
      this.plans.set(id, plan);
    }
  }

  async getRecentPlans(limit = 10): Promise<PlanType[]> {
    const plans = Array.from(this.plans.values())
      .filter(plan => plan.status === "active")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    return plans;
  }

  async getPlanStats(): Promise<PlanStats> {
    const activePlans = Array.from(this.plans.values()).filter(plan => plan.status === "active");
    const totalPlans = activePlans.length;
    const totalDownloads = activePlans.reduce((sum, plan) => sum + (plan.downloadCount || 0), 0);
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentUploads = activePlans.filter(plan => new Date(plan.createdAt) >= oneDayAgo).length;

    return {
      totalPlans,
      totalDownloads,
      recentUploads,
    };
  }
}

export class DatabaseStorage implements IStorage {
  private searchCache = new Map<string, { result: {plans: PlanType[], total: number}, timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

  private getCacheKey(filters: PlanFilters): string {
    return JSON.stringify(filters);
  }

  private isValidCacheEntry(entry: { result: {plans: PlanType[], total: number}, timestamp: number }): boolean {
    return Date.now() - entry.timestamp < this.CACHE_TTL;
  }

  private clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.searchCache.entries()) {
      if (now - entry.timestamp >= this.CACHE_TTL) {
        this.searchCache.delete(key);
      }
    }
  }
  async incrementUserDownloadCount(userId: string): Promise<void> {
    try {
      await User.findOneAndUpdate(
        { id: userId },
        { $inc: { downloadCount: 1 } }
      );
    } catch (error) {
      console.error('Error incrementing user download count:', error);
      throw error;
    }
  }
  async getUser(id: string): Promise<UserType | null> {
    try {
      const user = await User.findOne({ id });
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<UserType> {
    try {
      const user = await User.findOneAndUpdate(
        { id: userData.id },
        { ...userData, updatedAt: new Date() },
        { upsert: true, new: true }
      );
      if (!user) {
        throw new Error('Failed to upsert user');
      }
      return user;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  async searchPlans(filters: PlanFilters): Promise<{plans: PlanType[], total: number}> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(filters);
      const cachedResult = this.searchCache.get(cacheKey);
      
      if (cachedResult && this.isValidCacheEntry(cachedResult)) {
        return cachedResult.result;
      }
      
      // Clear expired cache entries periodically
      this.clearExpiredCache();
      
      const query: any = { status: "active" };

    if (filters.lotSize && filters.lotSize !== "Any Size") {
      query.lotSize = filters.lotSize;
    }

    if (filters.orientation && filters.orientation !== "Any Orientation") {
      query.orientation = filters.orientation;
    }

    if (filters.siteType && filters.siteType !== "Any Type") {
      query.siteType = filters.siteType;
    }

    if (filters.foundationType && filters.foundationType !== "Any Foundation") {
      query.foundationType = filters.foundationType;
    }

    if (filters.storeys && filters.storeys !== "Any") {
      const storeyMap: Record<string, number> = {
        "Single Storey": 1,
        "Two Storey": 2,
        "Three+ Storey": 3,
      };
      const storeyNumber = storeyMap[filters.storeys];
      if (storeyNumber) {
        if (storeyNumber === 3) {
          query.storeys = { $gte: 3 };
        } else {
          query.storeys = storeyNumber;
        }
      }
    }

    if (filters.councilArea && filters.councilArea !== "Any Council") {
      query.councilArea = filters.councilArea;
    }

    // Handle keyword search (searches across multiple fields including extracted keywords)
    if (filters.keyword) {
      query.$or = [
        { title: { $regex: filters.keyword, $options: 'i' } },
        { description: { $regex: filters.keyword, $options: 'i' } },
        { builderName: { $regex: filters.keyword, $options: 'i' } },
        { extractedKeywords: { $in: [new RegExp(filters.keyword, 'i')] } }
      ];
    }

    // Handle general search (legacy support)
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { builderName: { $regex: filters.search, $options: 'i' } },
        { extractedKeywords: { $in: [new RegExp(filters.search, 'i')] } }
      ];
    }

    // Lot size range filters
    if (filters.lotSizeMin) {
      const minSize = parseFloat(filters.lotSizeMin);
      if (!isNaN(minSize)) {
        query.lotSizeMin = { $gte: minSize };
      }
    }

    if (filters.lotSizeMax) {
      const maxSize = parseFloat(filters.lotSizeMax);
      if (!isNaN(maxSize)) {
        query.lotSizeMax = { $lte: maxSize };
      }
    }

    // Plan type filter
    if (filters.planType && filters.planType !== "Any Type") {
      query.planType = filters.planType;
    }

    // Numeric filters
    if (filters.plotLength) {
      const length = parseFloat(filters.plotLength);
      if (!isNaN(length)) {
        query.plotLength = length;
      }
    }

    if (filters.plotWidth) {
      const width = parseFloat(filters.plotWidth);
      if (!isNaN(width)) {
        query.plotWidth = width;
      }
    }

    if (filters.coveredArea) {
      const area = parseFloat(filters.coveredArea);
      if (!isNaN(area)) {
        query.coveredArea = area;
      }
    }

    if (filters.totalBuildingHeight) {
      const height = parseFloat(filters.totalBuildingHeight);
      if (!isNaN(height)) {
        query.totalBuildingHeight = height;
      }
    }

    if (filters.roofPitch) {
      const pitch = parseFloat(filters.roofPitch);
      if (!isNaN(pitch)) {
        query.roofPitch = pitch;
      }
    }

    // Road position filter
    if (filters.roadPosition && filters.roadPosition !== "Any Position") {
      query.roadPosition = filters.roadPosition;
    }

    // Builder name filter
    if (filters.builderName) {
      query.builderName = { $regex: filters.builderName, $options: 'i' };
    }

    // Room configuration filters
    if (filters.bedrooms && filters.bedrooms !== "Any") {
      if (filters.bedrooms === "5+") {
        query.bedrooms = { $gte: 5 };
      } else {
        query.bedrooms = parseInt(filters.bedrooms || "0");
      }
    }

    if (filters.toilets && filters.toilets !== "Any") {
      if (filters.toilets === "5+") {
        query.toilets = { $gte: 5 };
      } else {
        query.toilets = parseInt(filters.toilets || "0");
      }
    }

    if (filters.livingAreas && filters.livingAreas !== "Any") {
      if (filters.livingAreas === "5+") {
        query.livingAreas = { $gte: 5 };
      } else {
        query.livingAreas = parseInt(filters.livingAreas || "0");
      }
    }

    if (filters.houseType && filters.houseType !== "Any Type") {
      query.houseType = filters.houseType;
    }

    if (filters.constructionType && filters.constructionType !== "Any Construction") {
      query.constructionType = { $in: [filters.constructionType] };
    }

    // Feature filters (text search in arrays)
    if (filters.outdoorFeatures) {
      query.outdoorFeatures = { $regex: filters.outdoorFeatures, $options: 'i' };
    }

    if (filters.indoorFeatures) {
      query.indoorFeatures = { $regex: filters.indoorFeatures, $options: 'i' };
    }

    // Determine sort field and order
    const sortField = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sortOptions: { [key: string]: 1 | -1 } = {};
    sortOptions[sortField] = sortOrder;

    let mongoQuery = Plan.find(query)
      .select('-content') // Exclude large content field from search results
      .sort(sortOptions);

    if (filters.limit) {
      mongoQuery = mongoQuery.limit(filters.limit);
    }

    if (filters.offset) {
      mongoQuery = mongoQuery.skip(filters.offset);
    }

    const [plans, total] = await Promise.all([
      mongoQuery.exec(),
      Plan.countDocuments(query)
    ]);

    const result = { plans, total };
    
    // Cache the result
    this.searchCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    return result;
    } catch (error) {
      console.error('Error searching plans:', error);
      throw error;
    }
  }

  async getPlan(id: string, excludeContent: boolean = false): Promise<PlanType | null> {
    try {
      let query = Plan.findById(id);
      if (excludeContent) {
        query = query.select('-content');
      }
      const plan = await query;
      return plan;
    } catch (error) {
      console.error('Error getting plan:', error);
      throw error;
    }
  }

  async getPlanAndIncrementDownload(id: string, excludeContent: boolean = false): Promise<PlanType | null> {
    try {
      let selectFields = excludeContent ? '-content' : '';
      const plan = await Plan.findByIdAndUpdate(
        id,
        { $inc: { downloadCount: 1 } },
        { 
          new: true,
          select: selectFields || undefined
        }
      );
      return plan;
    } catch (error) {
      console.error('Error getting plan and incrementing download:', error);
      throw error;
    }
  }

  async createPlan(planData: InsertPlan): Promise<PlanType> {
    try {
      // Extract keywords from description if provided
      let extractedKeywords: string[] = [];
      if (planData.description) {
        const keywordResult = extractKeywordsFromDescription(planData.description);
        extractedKeywords = keywordResult.keywords;
        console.log(`🔍 Extracted ${extractedKeywords.length} keywords from description: ${extractedKeywords.join(', ')}`);
      }

      const plan = new Plan({
        ...planData,
        extractedKeywords,
        status: planData.status || "active",
        downloadCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const savedPlan = await plan.save();
      // Clear search cache after creation to ensure fresh results
      this.searchCache.clear();
      return savedPlan;
    } catch (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
  }

  async updatePlan(id: string, updates: Partial<InsertPlan>): Promise<PlanType | null> {
    try {
      // Extract keywords from description if it's being updated
      let updateData = { ...updates, updatedAt: new Date() };
      if (updates.description) {
        const keywordResult = extractKeywordsFromDescription(updates.description);
        updateData.extractedKeywords = keywordResult.keywords;
        console.log(`🔍 Updated extracted keywords: ${keywordResult.keywords.join(', ')}`);
      }

      const plan = await Plan.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
      // Clear search cache after update to ensure fresh results
      this.searchCache.clear();
      return plan;
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  }

  async deletePlan(id: string): Promise<void> {
    try {
      await Plan.findByIdAndDelete(id);
      // Clear search cache after deletion to ensure fresh results
      this.searchCache.clear();
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  }

  async incrementDownloadCount(id: string): Promise<void> {
    try {
      await Plan.findByIdAndUpdate(
        id,
        { $inc: { downloadCount: 1 } }
      );
    } catch (error) {
      console.error('Error incrementing download count:', error);
      throw error;
    }
  }

  async resetDownloadCount(id: string): Promise<void> {
    try {
      await Plan.findByIdAndUpdate(
        id,
        { $set: { downloadCount: 0 } }
      );
    } catch (error) {
      console.error('Error resetting download count:', error);
      throw error;
    }
  }

  async getRecentPlans(limit = 10): Promise<PlanType[]> {
    try {
      return await Plan.find({ status: "active" })
        .select('-content') // Exclude large content field from recent plans
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      console.error('Error getting recent plans:', error);
      throw error;
    }
  }

  async getPlanStats(): Promise<PlanStats> {
    try {
      const totalPlans = await Plan.countDocuments({ status: "active" });
      
      const downloadStats = await Plan.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: null, totalDownloads: { $sum: "$downloadCount" } } }
      ]);
      
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentUploads = await Plan.countDocuments({
        status: "active",
        createdAt: { $gte: oneDayAgo }
      });

      return {
        totalPlans,
        totalDownloads: downloadStats[0]?.totalDownloads || 0,
        recentUploads,
      };
    } catch (error) {
      console.error('Error getting plan stats:', error);
      throw error;
    }
  }
}

// Initialize storage instance based on MongoDB availability
let storage: IStorage;

export function initializeStorage(): IStorage {
  console.log('🔍 Storage Configuration:');
  console.log(`   MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);
  console.log(`   MONGODB_URI length: ${process.env.MONGODB_URI?.length || 0}`);

  if (process.env.MONGODB_URI) {
    console.log('✅ Using MongoDB Database Storage');
    storage = new DatabaseStorage();
  } else {
    console.log('⚠️  Falling back to in-memory storage.');
    storage = new MemoryStorage();
  }
  
  return storage;
}

// Export getter function for storage
export function getStorage(): IStorage {
  if (!storage) {
    throw new Error('Storage not initialized. Call initializeStorage() first.');
  }
  return storage;
}
