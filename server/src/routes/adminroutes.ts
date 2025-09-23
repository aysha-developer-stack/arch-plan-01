import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticateAdmin } from '../middleware/authMiddleware';
import { createAdmin, authenticateAdmin as authAdmin, getAllAdmins, deleteAdmin } from '../services/adminService';
import { supabase } from '../../db';
import { getStorage } from '../../storage';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { insertPlanSchema } from '../schema';

// Define schemas
const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const adminCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2)
});

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Admin login route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validatedData = adminLoginSchema.parse(req.body);
    const { email, password } = validatedData;

    const { admin, session } = await authAdmin(email, password);

    // Set the session token in a cookie
    res.cookie('supabase-auth-token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: session.expires_in * 1000
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      admin
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: error.errors
      });
    }
    
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
});

// Admin logout route
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    res.clearCookie('supabase-auth-token');
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error: any) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Logout failed'
    });
  }
});

// Create admin route (admin only)
router.post('/create', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const validatedData = adminCreateSchema.parse(req.body);
    const { email, password, name } = validatedData;

    const admin = await createAdmin(email, password, name);

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin
    });
  } catch (error: any) {
    console.error('Create admin error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create admin'
    });
  }
});

// Get all admins route (admin only)
router.get('/all', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const admins = await getAllAdmins();

    res.status(200).json({
      success: true,
      data: admins
    });
  } catch (error: any) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get admins'
    });
  }
});

// Check auth route (admin only)
router.get('/check-auth', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    // If the middleware passes, the user is authenticated
    res.status(200).json({
      success: true,
      message: 'Authenticated',
      adminId: req.adminId
    });
  } catch (error: any) {
    console.error('Check auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
});

// Delete admin route (admin only)
router.delete('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Don't allow deleting yourself
    if (id === req.adminId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own admin account'
      });
    }

    const success = await deleteAdmin(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found or could not be deleted'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete admin'
    });
  }
});

// Get all plans for admin (admin only)
router.get('/plans', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = req.query.sortBy as string || 'created_at';
    const sortOrder: 'asc' | 'desc' = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    const filters = {
      limit,
      offset: (page - 1) * limit,
      sortBy,
      sortOrder
    };

    const result = await storage.searchPlans(filters);

    res.status(200).json({
      success: true,
      data: result.plans,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching admin plans:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch plans'
    });
  }
});

// Upload plan (admin only)
router.post('/plans', authenticateAdmin, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    // Parse the plan data from the request body
    const planData: any = { ...req.body };
    
    // Handle the main PDF file
    if (files?.file && files.file[0]) {
      const file = files.file[0];
      const fileContent = fs.readFileSync(file.path);
      planData.content = fileContent.toString("base64");
      planData.fileName = file.originalname;
      planData.fileSize = file.size;
      planData.filePath = path.relative(process.cwd(), file.path);
      
      // Clean up the uploaded file after reading
      fs.unlinkSync(file.path);
    }
    
    // Handle image files
    if (files?.images && files.images.length > 0) {
      const imageObjects = [];
      for (const imageFile of files.images) {
        const relativePath = path.relative(process.cwd(), imageFile.path);
        // Generate a unique fileId based on the filename without extension
        const fileId = path.basename(imageFile.filename, path.extname(imageFile.filename));
        imageObjects.push({
          path: relativePath,
          filename: imageFile.originalname,
          size: imageFile.size,
          fileId: fileId
        });
      }
      planData.images = imageObjects;
    }
    
    // Parse arrays from JSON strings if they exist
    if (planData.outdoorFeatures && typeof planData.outdoorFeatures === 'string') {
      try {
        planData.outdoorFeatures = JSON.parse(planData.outdoorFeatures);
      } catch (e) {
        planData.outdoorFeatures = [];
      }
    }
    
    if (planData.indoorFeatures && typeof planData.indoorFeatures === 'string') {
      try {
        planData.indoorFeatures = JSON.parse(planData.indoorFeatures);
      } catch (e) {
        planData.indoorFeatures = [];
      }
    }
    
    // Handle construction type - convert single string to array
    if (planData.constructionType && typeof planData.constructionType === 'string') {
      planData.constructionType = [planData.constructionType];
    }
    
    // Convert numeric fields
    if (planData.storeys) planData.storeys = parseInt(planData.storeys);
    if (planData.bedrooms) planData.bedrooms = parseInt(planData.bedrooms);
    if (planData.toilets) planData.toilets = parseInt(planData.toilets);
    if (planData.livingAreas) planData.livingAreas = parseInt(planData.livingAreas);
    if (planData.numberOfUnits) planData.numberOfUnits = parseInt(planData.numberOfUnits);
    if (planData.totalBuildingHeight) planData.totalBuildingHeight = parseFloat(planData.totalBuildingHeight);
    if (planData.roofPitch) planData.roofPitch = parseFloat(planData.roofPitch);
    
    // Convert additional numeric fields that come as strings from the frontend
    if (planData.plotLength) planData.plotLength = parseFloat(planData.plotLength);
    if (planData.plotWidth) planData.plotWidth = parseFloat(planData.plotWidth);
    if (planData.coveredArea) planData.coveredArea = parseFloat(planData.coveredArea);
    if (planData.lotSizeMin) planData.lotSizeMin = parseFloat(planData.lotSizeMin);
    if (planData.lotSizeMax) planData.lotSizeMax = parseFloat(planData.lotSizeMax);
    
    // Set default values
    planData.status = 'active';
    planData.downloadCount = 0;
    // Set uploadedBy to the admin's user ID
    planData.uploadedBy = req.adminId;
    
    // Map builderName to architect field for database compatibility
    if (planData.builderName) {
      planData.architect = planData.builderName;
    }
    
    // Map planType to building_type field for database compatibility
    if (planData.planType) {
      planData.building_type = planData.planType;
    } else {
      // Set a default value if planType is not provided
      planData.building_type = "Residential";
    }
    
    // Ensure building_type is never null
    if (!planData.building_type) {
      planData.building_type = "Residential";
    }
    
    // Validate the plan data
    const validatedData = insertPlanSchema.parse(planData);
    
    // Create the plan with admin user ID
    const newPlan = await storage.createPlan(validatedData, req.adminId);
    
    res.status(201).json({
      success: true,
      message: 'Plan uploaded successfully',
      data: newPlan
    });
    
  } catch (error: any) {
    console.error('Error uploading plan:', error);
    
    // Clean up any uploaded files on error
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files?.file && files.file[0]) {
      try {
        fs.unlinkSync(files.file[0].path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    if (files?.images) {
      files.images.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {
          // Ignore cleanup errors
        }
      });
    }
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan data',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload plan'
    });
  }
});

// Delete plan (admin only)
router.delete('/plans/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const planId = req.params.id;
    
    // Get the plan first to clean up files
    const plan = await storage.getPlan(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    // Delete the plan from storage
    await storage.deletePlan(planId);
    
    res.status(200).json({
      success: true,
      message: 'Plan deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Error deleting plan:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete plan'
    });
  }
});

// Get admin statistics
router.get('/stats', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    
    // Get plan stats
    const planStats = await storage.getPlanStats();
    
    // Get user stats from Supabase function
    const { data: userStats, error: userStatsError } = await supabase.rpc('get_user_stats');
    if (userStatsError) {
      console.error('Error getting user stats:', userStatsError);
      throw userStatsError;
    }
    
    // Get admin count
    const { count: adminCount, error: adminCountError } = await supabase
      .from('admins')
      .select('*', { count: 'exact', head: true });
    
    if (adminCountError) {
      console.error('Error getting admin count:', adminCountError);
      throw adminCountError;
    }
    
    const stats = {
      // Flatten the plan stats to match frontend expectations
      totalPlans: planStats.totalPlans,
      totalDownloads: planStats.totalDownloads,
      recentUploads: planStats.recentUploads,
      // Keep the nested structure for users and admins
      users: userStats[0] || {
        total_users: 0,
        pending_users: 0,
        approved_users: 0,
        rejected_users: 0
      },
      admins: {
        total: adminCount || 0
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ message: 'Error getting admin statistics' });
  }
});

export default router;