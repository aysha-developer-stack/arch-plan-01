import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { AppUser, IAppUser } from '../schema';

// Extend the Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      appUser?: IAppUser;
    }
  }
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  // Get token from cookies or Authorization header
  let token = req.cookies?.userToken;
  
  // If no cookie, check Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required. No token provided.' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    
    // Get user from database to check status
    const user = await AppUser.findById(decoded.userId).select('-password');
    if (!user) {
      // Clear invalid token
      res.clearCookie('userToken', {
        httpOnly: config.COOKIE_HTTP_ONLY,
        secure: config.COOKIE_SECURE,
        sameSite: config.COOKIE_SAME_SITE,
      });
      return res.status(401).json({ 
        success: false, 
        message: 'User not found. Please log in again.' 
      });
    }

    // Check if user is approved
    if (user.status !== 'approved') {
      let message = 'Account access denied.';
      if (user.status === 'pending') {
        message = 'Your account is awaiting admin approval.';
      } else if (user.status === 'rejected') {
        message = user.rejectionReason || 'Your account has been rejected. Please contact support.';
      }
      
      return res.status(403).json({ 
        success: false, 
        message,
        status: user.status,
        rejectionReason: user.status === 'rejected' ? user.rejectionReason : undefined
      });
    }
    
    // Add user ID and user object to request
    req.userId = decoded.userId;
    req.appUser = user;
    
    // Proceed to the next middleware/route handler
    next();
  } catch (error) {
    console.error('User authentication error:', error);
    
    // Clear invalid token
    res.clearCookie('userToken', {
      httpOnly: config.COOKIE_HTTP_ONLY,
      secure: config.COOKIE_SECURE,
      sameSite: config.COOKIE_SAME_SITE,
    });

    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token. Please log in again.' 
    });
  }
};

// Middleware that only checks JWT validity (for routes that need basic auth)
export const authenticateUserBasic = (req: Request, res: Response, next: NextFunction) => {
  // Get token from cookies or Authorization header
  let token = req.cookies?.userToken;
  
  // If no cookie, check Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required. No token provided.' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    
    // Add user ID to request object
    req.userId = decoded.userId;
    
    // Proceed to the next middleware/route handler
    next();
  } catch (error) {
    console.error('User authentication error:', error);
    
    // Clear invalid token
    res.clearCookie('userToken', {
      httpOnly: config.COOKIE_HTTP_ONLY,
      secure: config.COOKIE_SECURE,
      sameSite: config.COOKIE_SAME_SITE,
    });

    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token. Please log in again.' 
    });
  }
};

export default {
  authenticateUser,
  authenticateUserBasic,
};