import {
  users,
  plans,
  type User,
  type UpsertUser,
  type Plan,
  type InsertPlan,
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and, sql, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Plan operations
  searchPlans(filters: PlanFilters): Promise<Plan[]>;
  getPlan(id: string): Promise<Plan | undefined>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(id: string, updates: Partial<InsertPlan>): Promise<Plan>;
  deletePlan(id: string): Promise<void>;
  incrementDownloadCount(id: string): Promise<void>;
  getRecentPlans(limit?: number): Promise<Plan[]>;
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
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async searchPlans(filters: PlanFilters): Promise<Plan[]> {
    const conditions = [eq(plans.status, "active")];

    if (filters.lotSize && filters.lotSize !== "Any Size") {
      conditions.push(eq(plans.lotSize, filters.lotSize));
    }

    if (filters.orientation && filters.orientation !== "Any Orientation") {
      conditions.push(eq(plans.orientation, filters.orientation));
    }

    if (filters.siteType && filters.siteType !== "Any Type") {
      conditions.push(eq(plans.siteType, filters.siteType));
    }

    if (filters.foundationType && filters.foundationType !== "Any Foundation") {
      conditions.push(eq(plans.foundationType, filters.foundationType));
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
          conditions.push(sql`${plans.storeys} >= 3`);
        } else {
          conditions.push(eq(plans.storeys, storeyNumber));
        }
      }
    }

    if (filters.councilArea && filters.councilArea !== "Any Council") {
      conditions.push(eq(plans.councilArea, filters.councilArea));
    }

    if (filters.search) {
      conditions.push(
        sql`(${ilike(plans.title, `%${filters.search}%`)} OR ${ilike(plans.description, `%${filters.search}%`)})`
      );
    }

    const baseQuery = db.select().from(plans).where(and(...conditions)).orderBy(desc(plans.createdAt));

    if (filters.limit && filters.offset) {
      return await baseQuery.limit(filters.limit).offset(filters.offset);
    } else if (filters.limit) {
      return await baseQuery.limit(filters.limit);
    } else {
      return await baseQuery;
    }
  }

  async getPlan(id: string): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan;
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    const [newPlan] = await db.insert(plans).values(plan).returning();
    return newPlan;
  }

  async updatePlan(id: string, updates: Partial<InsertPlan>): Promise<Plan> {
    const [updatedPlan] = await db
      .update(plans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(plans.id, id))
      .returning();
    return updatedPlan;
  }

  async deletePlan(id: string): Promise<void> {
    await db.delete(plans).where(eq(plans.id, id));
  }

  async incrementDownloadCount(id: string): Promise<void> {
    await db
      .update(plans)
      .set({ downloadCount: sql`${plans.downloadCount} + 1` })
      .where(eq(plans.id, id));
  }

  async getRecentPlans(limit = 10): Promise<Plan[]> {
    return await db
      .select()
      .from(plans)
      .where(eq(plans.status, "active"))
      .orderBy(desc(plans.createdAt))
      .limit(limit);
  }

  async getPlanStats(): Promise<PlanStats> {
    const [statsResult] = await db
      .select({
        totalPlans: sql<number>`count(*)`,
        totalDownloads: sql<number>`sum(${plans.downloadCount})`,
      })
      .from(plans)
      .where(eq(plans.status, "active"));

    const [recentUploadsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(plans)
      .where(
        and(
          eq(plans.status, "active"),
          sql`${plans.createdAt} >= now() - interval '24 hours'`
        )
      );

    return {
      totalPlans: statsResult.totalPlans || 0,
      totalDownloads: statsResult.totalDownloads || 0,
      recentUploads: recentUploadsResult.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
