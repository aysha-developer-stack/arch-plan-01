import { Router } from 'express';
import { Request, Response } from 'express';
import { AppUser, appUserApprovalSchema } from '../schema';
import { authenticateAdmin } from '../middleware/authMiddleware';
import emailService from '../services/emailService';

const router = Router();

// Get all pending users (admin only)
router.get('/pending', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const pendingUsers = await AppUser.find({ status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

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
router.get('/all', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const users = await AppUser.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AppUser.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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
    // Validate input
    const validatedData = appUserApprovalSchema.parse(req.body);
    const { userId, action, rejectionReason } = validatedData;

    // Find the user
    const user = await AppUser.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already processed
    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `User is already ${user.status}`
      });
    }

    // Update user status
    if (action === 'approve') {
      user.status = 'approved';
      user.approvedAt = new Date();
      user.approvedBy = req.adminId; // From auth middleware
      user.rejectionReason = undefined; // Clear any previous rejection reason
    } else if (action === 'reject') {
      user.status = 'rejected';
      user.rejectionReason = rejectionReason || 'No reason provided';
      user.approvedAt = undefined;
      user.approvedBy = undefined;
    }

    await user.save();

    // Send email notification to user
    try {
      if (action === 'approve') {
        await emailService.sendApprovalEmail(user.email, user.name);
        console.log(`✅ Approval email sent to ${user.email}`);
      } else if (action === 'reject') {
        await emailService.sendRejectionEmail(user.email, user.name, user.rejectionReason || 'No reason provided');
        console.log(`📧 Rejection email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the entire operation if email fails
    }

    res.status(200).json({
      success: true,
      message: `User ${action}d successfully`,
      data: {
        userId: user._id,
        email: user.email,
        name: user.name,
        status: user.status,
        rejectionReason: user.rejectionReason,
        approvedAt: user.approvedAt,
        approvedBy: user.approvedBy
      }
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
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while processing request'
    });
  }
});

// Get user statistics (admin only)
router.get('/stats', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const stats = await AppUser.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id as keyof typeof formattedStats] = stat.count;
      formattedStats.total += stat.count;
    });

    res.status(200).json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

// Delete a user (admin only) - for cleanup purposes
router.delete('/:userId', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await AppUser.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await AppUser.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {
        deletedUser: {
          id: user._id,
          email: user.email,
          name: user.name
        }
      }
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
});

export default router;