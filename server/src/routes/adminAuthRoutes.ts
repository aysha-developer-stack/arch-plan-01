import { Router } from 'express';
import { Request, Response } from 'express';
import Admin from '../models/Admin';
import * as jwt from 'jsonwebtoken';
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
    };
    const token = (jwt as any).sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    });

    // 4. Send token in HTTP-only cookie
    res.cookie('adminToken', token, {
      httpOnly: config.COOKIE_HTTP_ONLY,
      secure: config.COOKIE_SECURE,
      sameSite: config.COOKIE_SAME_SITE,
      maxAge: config.COOKIE_MAX_AGE,
      path: '/',
    });

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

export default router;
