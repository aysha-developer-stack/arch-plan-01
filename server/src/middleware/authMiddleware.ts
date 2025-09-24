import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../db';

declare global {
  namespace Express {
    interface Request {
      adminId?: string;
    }
  }
}

export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.['supabase-auth-token'];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required. No token provided.' 
    });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token. Please log in again.' 
      });
    }

    // Check if the user has admin privileges by checking the is_admin flag in metadata
    if (!user.user_metadata?.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User is not an admin.'
      });
    }

    req.adminId = user.id;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication.' 
    });
  }
};

export default {
  authenticateAdmin,
};
