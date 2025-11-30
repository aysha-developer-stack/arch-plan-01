import { Router } from 'express';
import { authenticateAdmin } from '../middleware/authMiddleware';
import { supabase } from '../../db';
import { z } from 'zod';
// Define schema locally
const appUserApprovalSchema = z.object({
    userId: z.string(),
    action: z.enum(['approve', 'reject']),
    rejectionReason: z.string().optional()
});
const router = Router();
// Get all pending users (admin only)
router.get('/pending', authenticateAdmin, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching pending users'
        });
    }
});
// Get all users with pagination (admin only)
router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
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
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching users'
        });
    }
});
// Get all users with pagination (admin only) - keeping the /all route for backward compatibility
router.get('/all', authenticateAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
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
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching users'
        });
    }
});
// Approve or reject a user (admin only)
router.post('/approve-reject', authenticateAdmin, async (req, res) => {
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
        const updateData = { status: newStatus };
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
        res.status(200).json({
            success: true,
            message: `User ${action}d successfully`,
            data: updatedUser
        });
    }
    catch (error) {
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
router.get('/user-stats', authenticateAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.rpc('get_user_stats');
        if (error) {
            throw error;
        }
        res.status(200).json({
            success: true,
            data: data[0]
        });
    }
    catch (error) {
        console.error('Error fetching user statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching statistics'
        });
    }
});
// Get user statistics (admin only) - keeping the /stats route for backward compatibility
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.rpc('get_user_stats');
        if (error) {
            throw error;
        }
        res.status(200).json({
            success: true,
            data: data[0]
        });
    }
    catch (error) {
        console.error('Error fetching user statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching statistics'
        });
    }
});
// Delete a user (admin only)
router.delete('/:userId', authenticateAdmin, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting user'
        });
    }
});
export default router;
//# sourceMappingURL=adminUserRoutes.js.map