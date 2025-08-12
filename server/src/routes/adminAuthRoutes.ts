import { Router } from 'express';
import { Request, Response } from 'express';
import Admin from '../models/Admin';
import jwt from 'jsonwebtoken';
import { authenticateAdmin } from '../middleware/authMiddleware';
import config from '../config';

// Extend the Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      adminId?: string;
    }
  }
}

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // 1. Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2. Validate password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Generate JWT token
    const payload = {
      adminId: (admin as any)._id.toString(),
      email: admin.email
    } as const;
    
    const token = jwt.sign(
      payload, 
      config.JWT_SECRET as jwt.Secret,
      {
        expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
      }
    );

    // 4. Send token in HTTP-only cookie
    const cookieOptions = {
      httpOnly: config.COOKIE_HTTP_ONLY,
      secure: config.COOKIE_SECURE,
      sameSite: config.COOKIE_SAME_SITE as any,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    };
    
    res.cookie('adminToken', token, cookieOptions);

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', authenticateAdmin, (req: Request, res: Response) => {
  res.clearCookie('adminToken', {
    httpOnly: config.COOKIE_HTTP_ONLY,
    secure: config.COOKIE_SECURE,
    sameSite: config.COOKIE_SAME_SITE,
    path: '/',
  });
  
  res.status(200).json({ success: true, message: 'Logout successful' });
});

router.get('/check-auth', authenticateAdmin, (req: Request, res: Response) => {
  res.status(200).json({ isAuthenticated: true });
});

// Get current admin user info
router.get('/me', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: admin._id,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Error fetching admin info:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
