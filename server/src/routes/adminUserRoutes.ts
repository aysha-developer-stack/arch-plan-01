import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticateAdmin } from '../middleware/authMiddleware';
import { supabase } from '../../db';
import { z } from 'zod';
import emailService from '../services/emailService.js';

// Define schema locally
const appUserApprovalSchema = z.object({
  userId: z.string(),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional()
});

const router = Router();

// Get all pending users (admin only)
router.get('/pending', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { data: pendingUsers, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('status', 'pending');

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: pendingUsers,
      count: pendingUsers.length
    });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending users'
    });
  }
});

// Get all users with pagination (admin only)
router.get('/', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const rangeFrom = (page - 1) * limit;
    const rangeTo = rangeFrom + limit - 1;

    let query = supabase.from('app_users').select('*', { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: users, error, count } = await query.range(rangeFrom, rangeTo);

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// Get all users with pagination (admin only) - keeping the /all route for backward compatibility
router.get('/all', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const rangeFrom = (page - 1) * limit;
    const rangeTo = rangeFrom + limit - 1;

    let query = supabase.from('app_users').select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: users, error, count } = await query.range(rangeFrom, rangeTo);

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// Approve or reject a user (admin only)
router.post('/approve-reject', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const validatedData = appUserApprovalSchema.parse(req.body);
    const { userId, action, rejectionReason } = validatedData;

    const { data: user, error: fetchError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `User is already ${user.status}`
      });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const updateData: { status: string; rejection_reason?: string } = { status: newStatus };
    if (newStatus === 'rejected') {
      updateData.rejection_reason = rejectionReason;
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('app_users')
      .update(updateData)
      .eq('id', userId)
      .single();

    if (updateError) {
      throw updateError;
    }

    // Send email notification after successful status update
    try {
      if (action === 'approve') {
        await emailService.sendApprovalEmail(user.email, user.name);
      } else if (action === 'reject') {
        await emailService.sendRejectionEmail(user.email, user.name, rejectionReason || 'No specific reason provided');
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the request if email fails, just log the error
    }

    res.status(200).json({
      success: true,
      message: `User ${action}d successfully`,
      data: updatedUser
    });
  } catch (error: any) {
    console.error('Error processing user approval/rejection:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while processing request'
    });
  }
});

// Get user statistics (admin only)
router.get('/user-stats', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.rpc('get_user_stats');

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: data[0]
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

// Get user statistics (admin only) - keeping the /stats route for backward compatibility
router.get('/stats', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.rpc('get_user_stats');

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: data[0]
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

// Delete all users (admin only)
router.delete('/bulk/all', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    // First get count of users to be deleted
    const { count: userCount, error: countError } = await supabase
      .from('app_users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    // Delete all users from app_users table
    const { error } = await supabase
      .from('app_users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // This condition will match all rows

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      message: `All ${userCount} users deleted successfully`,
      data: { deletedCount: userCount }
    });
  } catch (error: any) {
    console.error('Error deleting all users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting all users'
    });
  }
});

// Delete a user (admin only)
router.delete('/:userId', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { data: deletedUser, error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: { deletedUser }
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
});

export default router;