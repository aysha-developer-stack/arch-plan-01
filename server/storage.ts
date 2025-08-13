import {
  User,
  Plan,
  type UserType,
  type UpsertUser,
  type PlanType,
  type InsertPlan,
} from "./src/schema.js";
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
  searchPlans(filters: PlanFilters): Promise<PlanType[]>;
  getPlan(id: string): Promise<PlanType | null>;
  createPlan(plan: InsertPlan): Promise<PlanType>;
  updatePlan(id: string, updates: Partial<InsertPlan>): Promise<PlanType | null>;
  deletePlan(id: string): Promise<void>;
  incrementDownloadCount(id: string): Promise<void>;
  resetDownloadCount(id: string, count: number): Promise<void>;
  getRecentPlans(limit?: number): Promise<PlanType[]>;
  getPlanStats(): Promise<PlanStats>;
}

export interface PlanFilters {
  lotSize?: string;
  orientation?: string;
  siteType?: string;
  foundationType?: string;
  storeys?: string;
  councilArea?: string;
  search?: string;
  bedrooms?: string;
  houseType?: string;
  constructionType?: string;
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

  async searchPlans(filters: PlanFilters): Promise<PlanType[]> {
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

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(plan => 
        plan.title.toLowerCase().includes(searchLower) ||
        (plan.description && plan.description.toLowerCase().includes(searchLower)) ||
        (plan.builderName && plan.builderName.toLowerCase().includes(searchLower))
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

    if (filters.offset) {
      results = results.slice(filters.offset);
    }

    if (filters.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  async getPlan(id: string): Promise<PlanType | null> {
    return this.plans.get(id) || null;
  }

  async createPlan(planData: InsertPlan): Promise<PlanType> {
    const id = (this.nextId++).toString();
    const plan = {
      _id: id as any,
      ...planData,
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
    
    const updated = {
      ...existing,
      ...updates,
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

  async resetDownloadCount(id: string, count: number): Promise<void> {
    const plan = this.plans.get(id);
    if (plan) {
      plan.downloadCount = count;
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

  async searchPlans(filters: PlanFilters): Promise<PlanType[]> {
    try {
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

    if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
      { builderName: { $regex: filters.search, $options: 'i' } }
    ];
  }

  if (filters.bedrooms && filters.bedrooms !== "Any") {
    if (filters.bedrooms === "5+") {
      query.bedrooms = { $gte: 5 };
    } else {
      query.bedrooms = parseInt(filters.bedrooms || "0");
    }
  }

  if (filters.houseType && filters.houseType !== "Any Type") {
    query.houseType = filters.houseType;
  }

  if (filters.constructionType && filters.constructionType !== "Any Construction") {
    query.constructionType = { $in: [filters.constructionType] };
  }

    // Determine sort field and order
    const sortField = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sortOptions: { [key: string]: 1 | -1 } = {};
    sortOptions[sortField] = sortOrder;

    let mongoQuery = Plan.find(query).sort(sortOptions);

    if (filters.limit) {
      mongoQuery = mongoQuery.limit(filters.limit);
    }

    if (filters.offset) {
      mongoQuery = mongoQuery.skip(filters.offset);
    }

      return await mongoQuery.exec();
    } catch (error) {
      console.error('Error searching plans:', error);
      throw error;
    }
  }

  async getPlan(id: string): Promise<PlanType | null> {
    try {
      const plan = await Plan.findById(id);
      return plan;
    } catch (error) {
      console.error('Error getting plan:', error);
      throw error;
    }
  }

  async createPlan(planData: InsertPlan): Promise<PlanType> {
    try {
      const plan = new Plan({
        ...planData,
        status: planData.status || "active",
        downloadCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return await plan.save();
    } catch (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
  }

  async updatePlan(id: string, updates: Partial<InsertPlan>): Promise<PlanType | null> {
    try {
      const plan = await Plan.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      );
      return plan;
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  }

  async deletePlan(id: string): Promise<void> {
    try {
      await Plan.findByIdAndDelete(id);
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

  async resetDownloadCount(id: string, count: number): Promise<void> {
    try {
      await Plan.findByIdAndUpdate(
        id,
        { $set: { downloadCount: count } }
      );
    } catch (error) {
      console.error('Error resetting download count:', error);
      throw error;
    }
  }

  async getRecentPlans(limit = 10): Promise<PlanType[]> {
    try {
      return await Plan.find({ status: "active" })
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
