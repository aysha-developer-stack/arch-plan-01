import { Router } from 'express';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppUser, appUserSignupSchema, appUserLoginSchema } from '../schema';
import { authenticateUser } from '../middleware/userAuthMiddleware';
import config from '../config';

// Extend the Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const router = Router();

// User signup route
router.post('/signup', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = appUserSignupSchema.parse(req.body);
    const { email, password, name } = validatedData;

    // Check if user already exists with timeout
    const findUserPromise = AppUser.findOne({ email: email.toLowerCase() }).maxTimeMS(5000).exec();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout after 5000ms')), 5000);
    });
    
    const existingUser = await Promise.race([findUserPromise, timeoutPromise]);
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user with pending status
    const newUser = new AppUser({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      status: 'pending'
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please wait for admin approval before logging in.',
      data: {
        email: newUser.email,
        name: newUser.name,
        status: newUser.status
      }
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during signup'
    });
  }
});

// User login route
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = appUserLoginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Find user with timeout
    const findUserPromise = AppUser.findOne({ email: email.toLowerCase() }).maxTimeMS(5000).exec();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout after 5000ms')), 5000);
    });
    
    const user = await Promise.race([findUserPromise, timeoutPromise]);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check approval status
    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval. Please wait for approval before logging in.',
        status: 'pending'
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: user.rejectionReason || 'Your account has been rejected. Please contact support.',
        status: 'rejected'
      });
    }

    // Generate JWT token for approved users
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name
    };
    
    const token = jwt.sign(
      payload, 
      config.JWT_SECRET as jwt.Secret,
      {
        expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
      }
    );

    // Send token in HTTP-only cookie
    const cookieOptions = {
      httpOnly: config.COOKIE_HTTP_ONLY,
      secure: config.COOKIE_SECURE,
      sameSite: config.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    };
    
    res.cookie('userToken', token, cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        status: user.status
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// User logout route
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('userToken', {
    httpOnly: config.COOKIE_HTTP_ONLY,
    secure: config.COOKIE_SECURE,
    sameSite: config.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
    path: '/',
  });
  
  res.status(200).json({ 
    success: true, 
    message: 'Logout successful' 
  });
});

// Check user authentication status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await AppUser.findOne({ email: email.toLowerCase() }).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        status: user.status,
        rejectionReason: user.status === 'rejected' ? user.rejectionReason : undefined,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get current user profile (authenticated users only)
router.get('/me', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = await AppUser.findById(req.userId).select('-password').maxTimeMS(5000);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only return user data if approved
    if (user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Account not approved',
        status: user.status,
        rejectionReason: user.status === 'rejected' ? user.rejectionReason : undefined
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        status: user.status,
        createdAt: user.createdAt,
        approvedAt: user.approvedAt
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;