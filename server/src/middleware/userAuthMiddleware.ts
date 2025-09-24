import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../db';

// Define the IAppUser interface locally since we're having trouble importing it
interface IAppUser {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  [key: string]: any;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      appUser?: IAppUser;
    }
  }
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  // Check for token in cookies (for admin routes) or Authorization header (for user routes)
  let token = req.cookies?.['supabase-auth-token'];
  
  // If no cookie token, check Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

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

    // Fetch user profile from your public.app_users table
    const { data: appUser, error: profileError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !appUser) {
        return res.status(401).json({
            success: false,
            message: 'User not found. Please log in again.'
        });
    }

    // Check if user is approved
    if (appUser.status !== 'approved') {
      let message = 'Account access denied.';
      if (appUser.status === 'pending') {
        message = 'Your account is awaiting admin approval.';
      } else if (appUser.status === 'rejected') {
        message = appUser.rejectionReason || 'Your account has been rejected. Please contact support.';
      }
      
      return res.status(403).json({ 
        success: false, 
        message,
        status: appUser.status,
        rejectionReason: appUser.status === 'rejected' ? appUser.rejectionReason : undefined
      });
    }
    
    req.userId = user.id;
    req.appUser = appUser as IAppUser;
    next();
  } catch (error) {
    console.error('User authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication.' 
    });
  }
};

export default {
  authenticateUser,
};