import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

// Extend the Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      adminId?: string;
    }
  }
}

declare global {
  namespace Express {
    interface Request {
      adminId?: string;
    }
  }
}

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Get token from cookies
  const token = req.cookies?.adminToken;

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required. No token provided.' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET) as { adminId: string };
    
    // Add admin ID to request object
    req.adminId = decoded.adminId;
    
    // Proceed to the next middleware/route handler
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Clear invalid token
    res.clearCookie('adminToken', {
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
  authenticateAdmin,
};
