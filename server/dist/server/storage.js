import { supabase } from "./db.js";
export class SupabaseStorage {
    BUCKET_NAME = 'plan-files';
    constructor() {
        this.initializeStorage();
    }
    async initializeStorage() {
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
                    fileSizeLimit: 50 * 1024 * 1024, // 50MB - reduced from 100MB
                    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/zip']
                });
                if (createError) {
                    console.error('Error creating bucket:', createError);
                    // Don't throw error, just log it and continue
                    console.log(`Continuing without bucket creation. Bucket may already exist or need manual creation.`);
                }
                else {
                    console.log(`Bucket '${this.BUCKET_NAME}' created successfully`);
                }
            }
        }
        catch (error) {
            console.error('Error initializing Supabase Storage:', error);
            // Continue execution even if bucket creation fails
            // The application can still function without file storage
        }
    }
    async getUser(id) {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", id)
            .single();
        if (error) {
            console.error("Error getting user:", error);
            return null;
        }
        return data;
    }
    async upsertUser(userData) {
        const { data, error } = await supabase
            .from("users")
            .upsert(userData)
            .select()
            .single();
        if (error) {
            console.error("Error upserting user:", error);
            throw error;
        }
        return data;
    }
    async incrementUserDownloadCount(userId) {
        const { error } = await supabase.rpc("increment_user_download_count", {
            user_id: userId,
        });
        if (error) {
            console.error("Error incrementing user download count:", error);
        }
    }
    async searchPlans(filters) {
        let query = supabase.from("plans").select("*", { count: "exact" });
        if (filters.keyword) {
            query = query.or(`title.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%`);
        }
        // Add other filters here based on the filters object
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
        const { data, error, count } = await query;
        if (error) {
            console.error("Error searching plans:", error);
            return { plans: [], total: 0 };
        }
        return { plans: data || [], total: count || 0 };
    }
    async getPlan(id, excludeContent = false) {
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
            }
            catch (err) {
                console.error('Error getting signed URL for plan file:', err);
            }
        }
        return data;
    }
    async createPlan(plan, userId) {
        // If the plan has content as base64, upload it to Supabase Storage
        if (plan.content && plan.fileName) {
            try {
                const buffer = Buffer.from(plan.content, 'base64');
                const filePath = await this.uploadFile(buffer, plan.fileName);
                // Replace the content with the file URL
                plan.file_url = filePath;
                delete plan.content;
            }
            catch (err) {
                console.error('Error uploading plan file:', err);
            }
        }
        // Ensure building_type is never null before database insertion
        const planWithBuildingType = plan;
        if (!planWithBuildingType.building_type) {
            if (plan.planType) {
                planWithBuildingType.building_type = plan.planType;
            }
            else {
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
        }
        else if (!planWithBuildingType.created_by) {
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
        return data;
    }
    async updatePlan(id, updates) {
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
            }
            catch (err) {
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
        return data;
    }
    async deletePlan(id) {
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
    async incrementDownloadCount(id) {
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
    async getRecentPlans(limit = 10) {
        const { data, error } = await supabase
            .from("plans")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit);
        if (error) {
            console.error("Error getting recent plans:", error);
            throw error;
        }
        return data;
    }
    async getPlanStats() {
        const { data, error } = await supabase.rpc("get_plan_stats");
        if (error) {
            console.error("Error getting plan stats:", error);
            return { totalPlans: 0, totalDownloads: 0, recentUploads: 0 };
        }
        return data;
    }
    // File operations using Supabase Storage
    async uploadFile(file, fileName) {
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
        }
        catch (error) {
            console.error('Error in uploadFile:', error);
            throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getFileUrl(filePath) {
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
        }
        catch (error) {
            console.error('Error in getFileUrl:', error);
            throw new Error(`Failed to get file URL: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async deleteFile(filePath) {
        try {
            const { error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .remove([filePath]);
            if (error) {
                console.error('Error deleting file:', error);
                throw error;
            }
        }
        catch (error) {
            console.error('Error in deleteFile:', error);
            // Don't throw error for delete operations to prevent cascading failures
            // Just log the error and continue
        }
    }
    getContentType(fileName) {
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
let storage = null;
export function getStorage() {
    if (!storage) {
        storage = new SupabaseStorage();
    }
    return storage;
}
export function initializeStorage() {
    if (!storage) {
        storage = new SupabaseStorage();
    }
}
//# sourceMappingURL=storage.js.map