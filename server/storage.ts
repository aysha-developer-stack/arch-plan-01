import {
  User,
  Plan,
  type UserType,
  type UpsertUser,
  type PlanType,
  type InsertPlan,
} from "@shared/schema";
import mongoose from "mongoose";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<UserType | null>;
  upsertUser(user: UpsertUser): Promise<UserType>;

  // Plan operations
  searchPlans(filters: PlanFilters): Promise<PlanType[]>;
  getPlan(id: string): Promise<PlanType | null>;
  createPlan(plan: InsertPlan): Promise<PlanType>;
  updatePlan(id: string, updates: Partial<InsertPlan>): Promise<PlanType | null>;
  deletePlan(id: string): Promise<void>;
  incrementDownloadCount(id: string): Promise<void>;
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
  limit?: number;
  offset?: number;
}

export interface PlanStats {
  totalPlans: number;
  totalDownloads: number;
  recentUploads: number;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<UserType | null> {
    const user = await User.findOne({ id });
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<UserType> {
    const user = await User.findOneAndUpdate(
      { id: userData.id },
      { ...userData, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    return user!;
  }

  async searchPlans(filters: PlanFilters): Promise<PlanType[]> {
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
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }

    let mongoQuery = Plan.find(query).sort({ createdAt: -1 });

    if (filters.limit) {
      mongoQuery = mongoQuery.limit(filters.limit);
    }

    if (filters.offset) {
      mongoQuery = mongoQuery.skip(filters.offset);
    }

    return await mongoQuery.exec();
  }

  async getPlan(id: string): Promise<PlanType | null> {
    const plan = await Plan.findById(id);
    return plan;
  }

  async createPlan(planData: InsertPlan): Promise<PlanType> {
    const plan = new Plan(planData);
    return await plan.save();
  }

  async updatePlan(id: string, updates: Partial<InsertPlan>): Promise<PlanType | null> {
    const plan = await Plan.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    return plan;
  }

  async deletePlan(id: string): Promise<void> {
    await Plan.findByIdAndDelete(id);
  }

  async incrementDownloadCount(id: string): Promise<void> {
    await Plan.findByIdAndUpdate(
      id,
      { $inc: { downloadCount: 1 } }
    );
  }

  async getRecentPlans(limit = 10): Promise<PlanType[]> {
    return await Plan.find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getPlanStats(): Promise<PlanStats> {
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
  }
}

export const storage = new DatabaseStorage();
