// import {
//   type UserType,
//   type UpsertUser,
//   type PlanType,
//   type InsertPlan,
// } from "./src/schema.js";
// import { supabase } from "./db.js";

// export interface IStorage {
//   // User operations
//   getUser(id: string): Promise<UserType | null>;
//   upsertUser(user: UpsertUser): Promise<UserType>;
//   incrementUserDownloadCount(userId: string): Promise<void>;

//   // Plan operations
//   searchPlans(filters: PlanFilters): Promise<{ plans: PlanType[]; total: number }>;
//   getPlan(id: string, excludeContent?: boolean): Promise<PlanType | null>;
//   createPlan(plan: InsertPlan, userId?: string): Promise<PlanType>;
//   updatePlan(id: string, updates: Partial<InsertPlan>): Promise<PlanType | null>;
//   deletePlan(id: string): Promise<void>;
//   incrementDownloadCount(id: string): Promise<void>;
//   getRecentPlans(limit?: number): Promise<PlanType[]>;
//   getPlanStats(): Promise<PlanStats>;

//   // File operations
//   uploadFile(file: Buffer, fileName: string): Promise<string>;
//   getFileUrl(filePath: string): Promise<string>;
//   deleteFile(filePath: string): Promise<void>;
// }

// export interface PlanFilters {
//   keyword?: string;
//   lotSize?: string;
//   lotSizeMin?: string;
//   lotSizeMax?: string;
//   orientation?: string;
//   siteType?: string;
//   foundationType?: string;
//   storeys?: string;
//   councilArea?: string;
//   search?: string;
//   bedrooms?: string;
//   houseType?: string;
//   constructionType?: string;
//   planType?: string;
//   plotLength?: string;
//   plotWidth?: string;
//   coveredArea?: string;
//   roadPosition?: string;
//   builderName?: string;
//   jobAddress?: string;
//   toilets?: string;
//   livingAreas?: string;
//   totalBuildingHeight?: string;
//   roofPitch?: string;
//   outdoorFeatures?: string;
//   indoorFeatures?: string;
//   numberOfUnits?: string;
//   limit?: number;
//   offset?: number;
//   sortBy?: string;
//   sortOrder?: "asc" | "desc";
// }

// export interface PlanStats {
//   totalPlans: number;
//   totalDownloads: number;
//   recentUploads: number;
// }

// export class SupabaseStorage implements IStorage {
//   private BUCKET_NAME = 'plan-files';

//   constructor() {
//     this.initializeStorage();
//   }

//   private async initializeStorage() {
//     try {
//       // Check if the bucket exists, if not create it
//       const { data: buckets, error: listError } = await supabase.storage.listBuckets();

//       if (listError) {
//         console.error('Error listing buckets:', listError);
//         throw new Error(`Failed to list Supabase buckets: ${listError.message}`);
//       }

//       const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);

//       if (!bucketExists) {
//         const { error: createError } = await supabase.storage.createBucket(this.BUCKET_NAME, {
//           public: false,
//           fileSizeLimit: 50 * 1024 * 1024, // 50MB - reduced from 100MB to avoid 413 errors
//           allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/zip']
//         });

//         if (createError) {
//           console.error('Error creating bucket:', createError);
//           // Don't throw error, just log it and continue
//           console.log(`Continuing without bucket creation. Bucket may already exist or need manual creation.`);
//         } else {
//           console.log(`Bucket '${this.BUCKET_NAME}' created successfully`);
//         }
//       }
//     } catch (error) {
//       console.error('Error initializing Supabase Storage:', error);
//       // Continue execution even if bucket creation fails
//       // The application can still function without file storage
//     }
//   }

//   async getUser(id: string): Promise<UserType | null> {
//     const { data, error } = await supabase
//       .from("users")
//       .select("*")
//       .eq("id", id)
//       .single();
//     if (error) {
//       console.error("Error getting user:", error);
//       return null;
//     }
//     return data as UserType;
//   }

//   async upsertUser(userData: UpsertUser): Promise<UserType> {
//     const { data, error } = await supabase
//       .from("users")
//       .upsert(userData)
//       .select()
//       .single();
//     if (error) {
//       console.error("Error upserting user:", error);
//       throw error;
//     }
//     return data as UserType;
//   }

//   async incrementUserDownloadCount(userId: string): Promise<void> {
//     const { error } = await supabase.rpc("increment_user_download_count", {
//       user_id: userId,
//     });
//     if (error) {
//       console.error("Error incrementing user download count:", error);
//     }
//   }

//   async searchPlans(
//     filters: PlanFilters
//   ): Promise<{ plans: PlanType[]; total: number }> {
//     console.log('🔍 Search filters received:', JSON.stringify(filters, null, 2));
//     let query = supabase.from("plans").select("*", { count: "exact" });

//     // If no filters are applied, return all plans for testing
//     const hasFilters = Object.values(filters).some(value =>
//       value !== undefined && value !== null && value !== '' &&
//       (!Array.isArray(value) || value.length > 0)
//     );

//     if (!hasFilters) {
//       console.log('🔍 No filters applied, returning all plans');
//       // Skip all filtering and return all plans for testing
//       console.log('🔍 Executing query...');
//       const { data, error, count } = await query;

//       if (error) {
//         console.error("❌ Error searching plans:", error);
//         return { plans: [], total: 0 };
//       }

//       console.log('✅ Search results (no filters):', { plansFound: data?.length || 0, totalCount: count || 0 });
//       return { plans: (data as PlanType[]) || [], total: count || 0 };
//     }

//     // Handle keyword search separately (OR logic within keywords only)
//     if (filters.keyword) {
//       console.log('🔍 Adding keyword filter:', filters.keyword);
//       const keywordConditions = [
//         `title.ilike.%${filters.keyword}%`,
//         `description.ilike.%${filters.keyword}%`
//       ];
//       query = query.or(keywordConditions.join(','));
//     }

//     // Handle outdoor features (AND logic - plan must have ALL selected outdoor features)
//     if (filters.outdoorFeatures) {
//       console.log('🔍 Processing outdoor features:', filters.outdoorFeatures);
//       const outdoorFeaturesArray = filters.outdoorFeatures.split(',').map(f => f.trim());
      
//       if (outdoorFeaturesArray.length > 0) {
//         // Use the cs (contains) operator with proper PostgreSQL array syntax
//         // Format: column.cs.{value1,value2,value3}
//         const arrayString = `{${outdoorFeaturesArray.join(',')}}`;
//         query = query.filter('outdoorFeatures', 'cs', arrayString);
//         console.log('🔍 Added outdoor feature filter with cs operator:', arrayString);
//       }
//     }

//     // Handle indoor features (AND logic - plan must have ALL selected indoor features)
//     if (filters.indoorFeatures) {
//       console.log('🔍 Processing indoor features:', filters.indoorFeatures);
//       const indoorFeaturesArray = filters.indoorFeatures.split(',').map(f => f.trim());
      
//       if (indoorFeaturesArray.length > 0) {
//         // Use the cs (contains) operator with proper PostgreSQL array syntax
//         // Format: column.cs.{value1,value2,value3}
//         const arrayString = `{${indoorFeaturesArray.join(',')}}`;
//         query = query.filter('indoorFeatures', 'cs', arrayString);
//         console.log('🔍 Added indoor feature filter with cs operator:', arrayString);
//       }
//     }
//     // Filter by other fields
//     if (filters.planType) {
//       query = query.eq('building_type', filters.planType);
//     }

//     if (filters.storeys) {
//       query = query.eq('storeys', parseInt(filters.storeys));
//     }

//     if (filters.bedrooms) {
//       query = query.eq('bedrooms', parseInt(filters.bedrooms));
//     }

//     if (filters.toilets) {
//       query = query.eq('toilets', parseInt(filters.toilets));
//     }

//     if (filters.livingAreas) {
//       query = query.eq('livingAreas', parseInt(filters.livingAreas));
//     }

//     if (filters.orientation) {
//       query = query.eq('orientation', filters.orientation);
//     }

//     if (filters.siteType) {
//       query = query.eq('siteType', filters.siteType);
//     }

//     if (filters.foundationType) {
//       query = query.eq('foundationType', filters.foundationType);
//     }

//     if (filters.councilArea) {
//       query = query.eq('councilArea', filters.councilArea);
//     }

//     if (filters.houseType) {
//       query = query.eq('houseType', filters.houseType);
//     }

//     if (filters.roadPosition) {
//       query = query.eq('roadPosition', filters.roadPosition);
//     }

//     // Lot size range filtering
//     if (filters.lotSizeMin && filters.lotSizeMax) {
//       const minSize = parseFloat(filters.lotSizeMin);
//       const maxSize = parseFloat(filters.lotSizeMax);
//       // Use lotSizeMin and lotSizeMax fields for range filtering
//       query = query.gte('lotSizeMin', minSize).lte('lotSizeMax', maxSize);
//     }

//     if (filters.sortBy) {
//       query = query.order(filters.sortBy, {
//         ascending: filters.sortOrder === "asc",
//       });
//     }

//     if (filters.limit) {
//       query = query.limit(filters.limit);
//     }

//     if (filters.offset) {
//       query = query.range(filters.offset, filters.offset + (filters.limit || 0) - 1);
//     }

//     console.log('🔍 Executing query...');
//     const { data, error, count } = await query;

//     if (error) {
//       console.error("❌ Error searching plans:", error);
//       return { plans: [], total: 0 };
//     }

//     console.log('✅ Search results:', { plansFound: data?.length || 0, totalCount: count || 0 });
//     console.log('🔍 First few plans:', data?.slice(0, 2)?.map(p => ({ id: p.id, title: p.title, outdoorFeatures: p.outdoorFeatures })));

//     return { plans: (data as PlanType[]) || [], total: count || 0 };
//   }

//   async getPlan(id: string, excludeContent: boolean = false): Promise<PlanType | null> {
//     let query = supabase.from("plans").select("*");
//     if (excludeContent) {
//       query = supabase.from("plans").select(`*, content:content_excluded`);
//     }
//     const { data, error } = await query.eq("id", id).single();

//     if (error) {
//       console.error("Error getting plan:", error);
//       return null;
//     }

//     // If the plan has a file_url, get a signed URL for it
//     if (data && data.file_url) {
//       try {
//         const fileUrl = await this.getFileUrl(data.file_url);
//         data.file_url = fileUrl;
//       } catch (err) {
//         console.error('Error getting signed URL for plan file:', err);
//       }
//     }

//     return data as PlanType;
//   }

//   async createPlan(plan: InsertPlan, userId?: string): Promise<PlanType> {
//     // If the plan has content as base64, upload it to Supabase Storage
//     if (plan.content && plan.fileName) {
//       try {
//         const buffer = Buffer.from(plan.content, 'base64');
//         const filePath = await this.uploadFile(buffer, plan.fileName);

//         // Replace the content with the file URL
//         plan.file_url = filePath;
//         delete plan.content;
//       } catch (err) {
//         console.error('Error uploading plan file:', err);
//       }
//     }

//     // Ensure building_type is never null before database insertion
//     const planWithBuildingType = plan as InsertPlan & {
//       building_type?: string;
//       keywords?: string[];
//       download_count?: number;
//       view_count?: number;
//       created_by?: string;
//     };
//     if (!planWithBuildingType.building_type) {
//       if (plan.planType) {
//         planWithBuildingType.building_type = plan.planType;
//       } else {
//         planWithBuildingType.building_type = "Residential"; // Default value
//       }
//     }

//     // Ensure keywords field is provided (required by database)
//     if (!planWithBuildingType.keywords) {
//       planWithBuildingType.keywords = [];
//     }

//     // Ensure download_count and view_count are provided (required by database)
//     if (planWithBuildingType.download_count === undefined) {
//       planWithBuildingType.download_count = 0;
//     }
//     if (planWithBuildingType.view_count === undefined) {
//       planWithBuildingType.view_count = 0;
//     }

//     // Ensure created_by is provided (required by database)
//     if (userId) {
//       planWithBuildingType.created_by = userId;
//     } else if (!planWithBuildingType.created_by) {
//       // If no userId provided and no created_by in plan, this will cause an error
//       // In production, you should always provide a userId
//       throw new Error("created_by is required - please provide a userId parameter");
//     }

//     const { data, error } = await supabase
//       .from("plans")
//       .insert(planWithBuildingType)
//       .select()
//       .single();
//     if (error) {
//       console.error("Error creating plan:", error);
//       throw error;
//     }
//     return data as PlanType;
//   }

//   async updatePlan(
//     id: string,
//     updates: Partial<InsertPlan>
//   ): Promise<PlanType | null> {
//     // If the plan update includes new content, upload it to Supabase Storage
//     if (updates.content && updates.fileName) {
//       try {
//         // Get the existing plan to check if we need to delete an old file
//         const existingPlan = await this.getPlan(id);
//         if (existingPlan && existingPlan.file_url) {
//           await this.deleteFile(existingPlan.file_url);
//         }

//         const buffer = Buffer.from(updates.content, 'base64');
//         const filePath = await this.uploadFile(buffer, updates.fileName);

//         // Replace the content with the file URL
//         updates.file_url = filePath;
//         delete updates.content;
//       } catch (err) {
//         console.error('Error updating plan file:', err);
//       }
//     }

//     const { data, error } = await supabase
//       .from("plans")
//       .update(updates)
//       .eq("id", id)
//       .select()
//       .single();
//     if (error) {
//       console.error("Error updating plan:", error);
//       return null;
//     }
//     return data as PlanType;
//   }

//   async deletePlan(id: string): Promise<void> {
//     // Get the plan to check if we need to delete a file
//     const plan = await this.getPlan(id);
//     if (plan && plan.file_url) {
//       await this.deleteFile(plan.file_url);
//     }

//     const { error } = await supabase.from("plans").delete().eq("id", id);
//     if (error) {
//       console.error("Error deleting plan:", error);
//     }
//   }

//   async incrementDownloadCount(id: string): Promise<void> {
//     // First get the current count
//     const { data: currentPlan, error: fetchError } = await supabase
//       .from("plans")
//       .select("download_count")
//       .eq("id", id)
//       .single();

//     if (fetchError) {
//       console.error("Error fetching current download count:", fetchError);
//       return;
//     }

//     // Then update with incremented value
//     const { error } = await supabase
//       .from("plans")
//       .update({
//         download_count: (currentPlan.download_count || 0) + 1,
//         updated_at: new Date().toISOString()
//       })
//       .eq("id", id);

//     if (error) {
//       console.error("Error incrementing plan download count:", error);
//     }
//   }

//   async getRecentPlans(limit: number = 10): Promise<PlanType[]> {
//     const { data, error } = await supabase
//       .from("plans")
//       .select("*")
//       .order("created_at", { ascending: false })
//       .limit(limit);
//     if (error) {
//       console.error("Error getting recent plans:", error);
//       throw error;
//     }
//     return data as PlanType[];
//   }

//   async getPlanStats(): Promise<PlanStats> {
//     const { data, error } = await supabase.rpc("get_plan_stats");
//     if (error) {
//       console.error("Error getting plan stats:", error);
//       return { totalPlans: 0, totalDownloads: 0, recentUploads: 0 };
//     }

//     // The Supabase function returns an array with one object containing snake_case fields
//     // We need to extract the first element and convert to camelCase
//     if (Array.isArray(data) && data.length > 0) {
//       const stats = data[0];
//       return {
//         totalPlans: stats.total_plans || 0,
//         totalDownloads: stats.total_downloads || 0,
//         recentUploads: stats.recent_uploads || 0
//       };
//     }

//     return { totalPlans: 0, totalDownloads: 0, recentUploads: 0 };
//   }

//   // File operations using Supabase Storage

//   async uploadFile(file: Buffer, fileName: string): Promise<string> {
//     try {
//       const timestamp = Date.now();
//       const uniqueFileName = `${timestamp}-${fileName}`;
//       const filePath = `${uniqueFileName}`;

//       const { error } = await supabase.storage
//         .from(this.BUCKET_NAME)
//         .upload(filePath, file, {
//           contentType: this.getContentType(fileName),
//           upsert: false
//         });

//       if (error) {
//         console.error('Error uploading file:', error);
//         throw error;
//       }

//       return filePath;
//     } catch (error) {
//       console.error('Error in uploadFile:', error);
//       throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
//     }
//   }

//   async getFileUrl(filePath: string): Promise<string> {
//     try {
//       const { data, error } = await supabase.storage
//         .from(this.BUCKET_NAME)
//         .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

//       if (error) {
//         console.error('Error getting file URL:', error);
//         throw error;
//       }

//       if (!data || !data.signedUrl) {
//         throw new Error('Failed to create signed URL: No data returned');
//       }

//       return data.signedUrl;
//     } catch (error) {
//       console.error('Error in getFileUrl:', error);
//       throw new Error(`Failed to get file URL: ${error instanceof Error ? error.message : String(error)}`);
//     }
//   }

//   async deleteFile(filePath: string): Promise<void> {
//     try {
//       const { error } = await supabase.storage
//         .from(this.BUCKET_NAME)
//         .remove([filePath]);

//       if (error) {
//         console.error('Error deleting file:', error);
//         throw error;
//       }
//     } catch (error) {
//       console.error('Error in deleteFile:', error);
//       // Don't throw error for delete operations to prevent cascading failures
//       // Just log the error and continue
//     }
//   }

//   private getContentType(fileName: string): string {
//     const extension = fileName.split('.').pop()?.toLowerCase();

//     switch (extension) {
//       case 'pdf':
//         return 'application/pdf';
//       case 'jpg':
//       case 'jpeg':
//         return 'image/jpeg';
//       case 'png':
//         return 'image/png';
//       case 'gif':
//         return 'image/gif';
//       default:
//         return 'application/octet-stream';
//     }
//   }
// }

// let storage: IStorage | null = null;

// export function getStorage(): IStorage {
//   if (!storage) {
//     storage = new SupabaseStorage();
//   }
//   return storage;
// }

// export function initializeStorage(): void {
//   if (!storage) {
//     storage = new SupabaseStorage();
//   }
// }
import {
  type UserType,
  type UpsertUser,
  type PlanType,
  type InsertPlan,
} from "./src/schema.js";
import { supabase } from "./db.js";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<UserType | null>;
  upsertUser(user: UpsertUser): Promise<UserType>;
  incrementUserDownloadCount(userId: string): Promise<void>;

  // Plan operations
  searchPlans(filters: PlanFilters): Promise<{ plans: PlanType[]; total: number }>;
  getPlan(id: string, excludeContent?: boolean): Promise<PlanType | null>;
  createPlan(plan: InsertPlan, userId?: string): Promise<PlanType>;
  updatePlan(id: string, updates: Partial<InsertPlan>): Promise<PlanType | null>;
  deletePlan(id: string): Promise<void>;
  incrementDownloadCount(id: string): Promise<void>;
  getRecentPlans(limit?: number): Promise<PlanType[]>;
  getPlanStats(): Promise<PlanStats>;

  // File operations
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

export class SupabaseStorage implements IStorage {
  private BUCKET_NAME = 'plan-files';

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      // Check if the bucket exists, if not create it
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.error('Error listing buckets:', listError);
        throw new Error(`Failed to list Supabase buckets: ${listError.message}`);
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);

      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: false,
          fileSizeLimit: 50 * 1024 * 1024, // 50MB - reduced from 100MB to avoid 413 errors
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/zip']
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
          // Don't throw error, just log it and continue
          console.log(`Continuing without bucket creation. Bucket may already exist or need manual creation.`);
        } else {
          console.log(`Bucket '${this.BUCKET_NAME}' created successfully`);
        }
      }
    } catch (error) {
      console.error('Error initializing Supabase Storage:', error);
      // Continue execution even if bucket creation fails
      // The application can still function without file storage
    }
  }

  async getUser(id: string): Promise<UserType | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.error("Error getting user:", error);
      return null;
    }
    return data as UserType;
  }

  async upsertUser(userData: UpsertUser): Promise<UserType> {
    const { data, error } = await supabase
      .from("users")
      .upsert(userData)
      .select()
      .single();
    if (error) {
      console.error("Error upserting user:", error);
      throw error;
    }
    return data as UserType;
  }

  async incrementUserDownloadCount(userId: string): Promise<void> {
    const { error } = await supabase.rpc("increment_user_download_count", {
      user_id: userId,
    });
    if (error) {
      console.error("Error incrementing user download count:", error);
    }
  }

  async searchPlans(
    filters: PlanFilters
  ): Promise<{ plans: PlanType[]; total: number }> {
    console.log('🔍 Search filters received:', JSON.stringify(filters, null, 2));
    let query = supabase.from("plans").select("*", { count: "exact" });

    // If no filters are applied, return all plans for testing
    const hasFilters = Object.values(filters).some(value =>
      value !== undefined && value !== null && value !== '' &&
      (!Array.isArray(value) || value.length > 0)
    );

    if (!hasFilters) {
      console.log('🔍 No filters applied, returning all plans');
      // Skip all filtering and return all plans for testing
      console.log('🔍 Executing query...');
      const { data, error, count } = await query;

      if (error) {
        console.error("❌ Error searching plans:", error);
        return { plans: [], total: 0 };
      }

      console.log('✅ Search results (no filters):', { plansFound: data?.length || 0, totalCount: count || 0 });
      return { plans: (data as PlanType[]) || [], total: count || 0 };
    }

    // Handle keyword search separately (OR logic within keywords only)
    if (filters.keyword) {
      console.log('🔍 Adding keyword filter:', filters.keyword);
      const keywordConditions = [
        `title.ilike.%${filters.keyword}%`,
        `description.ilike.%${filters.keyword}%`
      ];
      query = query.or(keywordConditions.join(','));
    }

    // Handle outdoor features - use direct SQL for array filtering
    if (filters.outdoorFeatures) {
        const outdoorFeaturesArray = filters.outdoorFeatures.split(',').map(f => f.trim());
        
        if (outdoorFeaturesArray.length > 0) {
            console.log('🔍 Processing outdoor features:', filters.outdoorFeatures);
            
            // Use direct SQL for array filtering with proper PostgreSQL syntax
            const outdoorConditions = [];
            
            // Create individual conditions for each feature using direct SQL
            for (const feature of outdoorFeaturesArray) {
                // Use direct SQL with proper array syntax
                outdoorConditions.push(`outdoorFeatures::text ILIKE '%${feature}%'`);
            }
            
            if (outdoorConditions.length > 0) {
                query = query.or(outdoorConditions.join(','));
                console.log('🔍 Added outdoor conditions:', outdoorConditions);
                console.log('🔍 Combined search conditions (OR logic):', outdoorConditions.join(','));
            }
        }
    }

    // Indoor Features - use direct SQL for array filtering
    if (filters.indoorFeatures) {
        const indoorFeaturesArray = filters.indoorFeatures.split(',').map(f => f.trim());
        
        if (indoorFeaturesArray.length > 0) {
            console.log('🔍 Processing indoor features:', filters.indoorFeatures);
            
            // Use direct SQL for array filtering with proper PostgreSQL syntax
            const indoorConditions = [];
            
            // Create individual conditions for each feature using direct SQL
            for (const feature of indoorFeaturesArray) {
                // Use direct SQL with proper array syntax
                indoorConditions.push(`indoorFeatures::text ILIKE '%${feature}%'`);
            }
            
            if (indoorConditions.length > 0) {
                query = query.or(indoorConditions.join(','));
                console.log('🔍 Added indoor conditions:', indoorConditions);
                console.log('🔍 Combined search conditions (OR logic):', indoorConditions.join(','));
            }
        }
    }

    // Filter by other fields
    if (filters.planType) {
      query = query.eq('building_type', filters.planType);
    }

    if (filters.storeys) {
      query = query.eq('storeys', parseInt(filters.storeys));
    }

    if (filters.bedrooms) {
      query = query.eq('bedrooms', parseInt(filters.bedrooms));
    }

    if (filters.toilets) {
      query = query.eq('toilets', parseInt(filters.toilets));
    }

    if (filters.livingAreas) {
      query = query.eq('livingAreas', parseInt(filters.livingAreas));
    }

    if (filters.orientation) {
      query = query.eq('orientation', filters.orientation);
    }

    if (filters.siteType) {
      query = query.eq('siteType', filters.siteType);
    }

    if (filters.foundationType) {
      query = query.eq('foundationType', filters.foundationType);
    }

    if (filters.councilArea) {
      query = query.eq('councilArea', filters.councilArea);
    }

    if (filters.houseType) {
      query = query.eq('houseType', filters.houseType);
    }

    if (filters.roadPosition) {
      query = query.eq('roadPosition', filters.roadPosition);
    }

    // Lot size range filtering
    if (filters.lotSizeMin && filters.lotSizeMax) {
      const minSize = parseFloat(filters.lotSizeMin);
      const maxSize = parseFloat(filters.lotSizeMax);
      // Use lotSizeMin and lotSizeMax fields for range filtering
      query = query.gte('lotSizeMin', minSize).lte('lotSizeMax', maxSize);
    }

    if (filters.sortBy) {
      query = query.order(filters.sortBy, {
        ascending: filters.sortOrder === "asc",
      });
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 0) - 1);
    }

    // Log the final query state
    console.log('🔍 Final query configuration:', {
      filters: JSON.stringify(filters),
      hasFilters,
      outdoorFeatures: filters.outdoorFeatures,
      indoorFeatures: filters.indoorFeatures
    });

    // Add more detailed logging before execution
    console.log('🔍 Query filters being applied:');
    if (filters.outdoorFeatures) {
      console.log('  - Outdoor features filter:', `{${filters.outdoorFeatures.split(',').map(f => `'${f.trim()}'`).join(',')}}`);
    }
    if (filters.indoorFeatures) {
      console.log('  - Indoor features filter:', `{${filters.indoorFeatures.split(',').map(f => `'${f.trim()}'`).join(',')}}`);
    }

    console.log('🔍 Executing query...');
    const { data, error, count } = await query;

    if (error) {
      console.error("❌ Error searching plans:", error);
      return { plans: [], total: 0 };
    }

    console.log('✅ Search results:', { plansFound: data?.length || 0, totalCount: count || 0 });
    console.log('🔍 First few plans:', data?.slice(0, 2)?.map(p => ({ id: p.id, title: p.title, outdoorFeatures: p.outdoorFeatures })));

    return { plans: (data as PlanType[]) || [], total: count || 0 };
  }

  async getPlan(id: string, excludeContent: boolean = false): Promise<PlanType | null> {
    let query = supabase.from("plans").select("*");
    if (excludeContent) {
      query = supabase.from("plans").select(`*, content:content_excluded`);
    }
    const { data, error } = await query.eq("id", id).single();

    if (error) {
      console.error("Error getting plan:", error);
      return null;
    }

    // If the plan has a file_url, get a signed URL for it
    if (data && data.file_url) {
      try {
        const fileUrl = await this.getFileUrl(data.file_url);
        data.file_url = fileUrl;
      } catch (err) {
        console.error('Error getting signed URL for plan file:', err);
      }
    }

    return data as PlanType;
  }

  async createPlan(plan: InsertPlan, userId?: string): Promise<PlanType> {
    // If the plan has content as base64, upload it to Supabase Storage
    if (plan.content && plan.fileName) {
      try {
        const buffer = Buffer.from(plan.content, 'base64');
        const filePath = await this.uploadFile(buffer, plan.fileName);

        // Replace the content with the file URL
        plan.file_url = filePath;
        delete plan.content;
      } catch (err) {
        console.error('Error uploading plan file:', err);
      }
    }

    // Ensure building_type is never null before database insertion
    const planWithBuildingType = plan as InsertPlan & {
      building_type?: string;
      keywords?: string[];
      download_count?: number;
      view_count?: number;
      created_by?: string;
    };
    if (!planWithBuildingType.building_type) {
      if (plan.planType) {
        planWithBuildingType.building_type = plan.planType;
      } else {
        planWithBuildingType.building_type = "Residential"; // Default value
      }
    }

    // Ensure keywords field is provided (required by database)
    if (!planWithBuildingType.keywords) {
      planWithBuildingType.keywords = [];
    }

    // Ensure download_count and view_count are provided (required by database)
    if (planWithBuildingType.download_count === undefined) {
      planWithBuildingType.download_count = 0;
    }
    if (planWithBuildingType.view_count === undefined) {
      planWithBuildingType.view_count = 0;
    }

    // Ensure created_by is provided (required by database)
    if (userId) {
      planWithBuildingType.created_by = userId;
    } else if (!planWithBuildingType.created_by) {
      // If no userId provided and no created_by in plan, this will cause an error
      // In production, you should always provide a userId
      throw new Error("created_by is required - please provide a userId parameter");
    }

    const { data, error } = await supabase
      .from("plans")
      .insert(planWithBuildingType)
      .select()
      .single();
    if (error) {
      console.error("Error creating plan:", error);
      throw error;
    }
    return data as PlanType;
  }

  async updatePlan(
    id: string,
    updates: Partial<InsertPlan>
  ): Promise<PlanType | null> {
    // If the plan update includes new content, upload it to Supabase Storage
    if (updates.content && updates.fileName) {
      try {
        // Get the existing plan to check if we need to delete an old file
        const existingPlan = await this.getPlan(id);
        if (existingPlan && existingPlan.file_url) {
          await this.deleteFile(existingPlan.file_url);
        }

        const buffer = Buffer.from(updates.content, 'base64');
        const filePath = await this.uploadFile(buffer, updates.fileName);

        // Replace the content with the file URL
        updates.file_url = filePath;
        delete updates.content;
      } catch (err) {
        console.error('Error updating plan file:', err);
      }
    }

    const { data, error } = await supabase
      .from("plans")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error("Error updating plan:", error);
      return null;
    }
    return data as PlanType;
  }

  async deletePlan(id: string): Promise<void> {
    // Get the plan to check if we need to delete a file
    const plan = await this.getPlan(id);
    if (plan && plan.file_url) {
      await this.deleteFile(plan.file_url);
    }

    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) {
      console.error("Error deleting plan:", error);
    }
  }

  async incrementDownloadCount(id: string): Promise<void> {
    // First get the current count
    const { data: currentPlan, error: fetchError } = await supabase
      .from("plans")
      .select("download_count")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching current download count:", fetchError);
      return;
    }

    // Then update with incremented value
    const { error } = await supabase
      .from("plans")
      .update({
        download_count: (currentPlan.download_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      console.error("Error incrementing plan download count:", error);
    }
  }

  async getRecentPlans(limit: number = 10): Promise<PlanType[]> {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("Error getting recent plans:", error);
      throw error;
    }
    return data as PlanType[];
  }

  async getPlanStats(): Promise<PlanStats> {
    const { data, error } = await supabase.rpc("get_plan_stats");
    if (error) {
      console.error("Error getting plan stats:", error);
      return { totalPlans: 0, totalDownloads: 0, recentUploads: 0 };
    }

    // The Supabase function returns an array with one object containing snake_case fields
    // We need to extract the first element and convert to camelCase
    if (Array.isArray(data) && data.length > 0) {
      const stats = data[0];
      return {
        totalPlans: stats.total_plans || 0,
        totalDownloads: stats.total_downloads || 0,
        recentUploads: stats.recent_uploads || 0
      };
    }

    return { totalPlans: 0, totalDownloads: 0, recentUploads: 0 };
  }

  // File operations using Supabase Storage

  async uploadFile(file: Buffer, fileName: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}-${fileName}`;
      const filePath = `${uniqueFileName}`;

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          contentType: this.getContentType(fileName),
          upsert: false
        });

      if (error) {
        console.error('Error uploading file:', error);
        throw error;
      }

      return filePath;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getFileUrl(filePath: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

      if (error) {
        console.error('Error getting file URL:', error);
        throw error;
      }

      if (!data || !data.signedUrl) {
        throw new Error('Failed to create signed URL: No data returned');
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error in getFileUrl:', error);
      throw new Error(`Failed to get file URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteFile:', error);
      // Don't throw error for delete operations to prevent cascading failures
      // Just log the error and continue
    }
  }

  private getContentType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      default:
        return 'application/octet-stream';
    }
  }
}

let storage: IStorage | null = null;

export function getStorage(): IStorage {
  if (!storage) {
    storage = new SupabaseStorage();
  }
  return storage;
}

export function initializeStorage(): void {
  if (!storage) {
    storage = new SupabaseStorage();
  }
}