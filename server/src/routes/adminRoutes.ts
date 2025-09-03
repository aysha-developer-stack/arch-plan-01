import { Router } from 'express';
import { Request, Response } from 'express';
import { AppUser } from '../schema';
import { authenticateAdmin } from '../middleware/authMiddleware';
import emailService from '../services/emailService';

const router = Router();

// Get all pending users
router.get('/pending-users', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const pendingUsers = await AppUser.find({ status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      users: pendingUsers
    });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all users (for admin dashboard)
router.get('/users', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const users = await AppUser.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await AppUser.countDocuments(query);
    
    res.status(200).json({
      success: true,
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Approve user
router.post('/approve-user/:userId', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await AppUser.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'User is not pending approval'
      });
    }
    
    user.status = 'approved';
    user.rejectionReason = undefined; // Clear any previous rejection reason
    await user.save();

    // Send approval email
    try {
      await emailService.sendApprovalEmail(user.email, user.name);
      console.log(`📧 Approval email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
      // Don't fail the approval if email fails
    }
    
    res.status(200).json({
      success: true,
      message: 'User approved successfully',
      user: {
          id: user._id,
          email: user.email,
          name: user.name,
          status: user.status
        }
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reject user
router.post('/reject-user/:userId', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const user = await AppUser.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'User is not pending approval'
      });
    }
    
    user.status = 'rejected';
    user.rejectionReason = reason.trim();
    await user.save();
    
    // Send rejection email
    try {
      await emailService.sendRejectionEmail(user.email, user.name, user.rejectionReason || 'No reason provided');
      console.log(`📧 Rejection email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
      // Don't fail the rejection if email fails
    }
    
    res.status(200).json({
      success: true,
      message: 'User rejected successfully',
      user: {
          id: user._id,
          email: user.email,
          name: user.name,
          status: user.status,
          rejectionReason: user.rejectionReason
        }
    });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user statistics
router.get('/user-stats', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const [pendingCount, approvedCount, rejectedCount, totalCount] = await Promise.all([
      AppUser.countDocuments({ status: 'pending' }),
      AppUser.countDocuments({ status: 'approved' }),
      AppUser.countDocuments({ status: 'rejected' }),
      AppUser.countDocuments()
    ]);
    
    res.status(200).json({
      success: true,
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
