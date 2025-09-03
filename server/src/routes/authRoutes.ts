import { Router } from 'express';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppUser } from '../schema';
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

// Register route
router.post('/register', async (req: Request, res: Response) => {
  try {
    console.log('🔍 Registration request received:');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Content-Type:', req.headers['content-type']);
    
    const { email, password, confirmPassword, firstName, lastName } = req.body;
    
    console.log('🔍 Extracted fields:');
    console.log('email:', email, 'type:', typeof email);
    console.log('password:', password ? '[REDACTED]' : 'undefined', 'type:', typeof password);
    console.log('confirmPassword:', confirmPassword ? '[REDACTED]' : 'undefined', 'type:', typeof confirmPassword);
    console.log('firstName:', firstName, 'type:', typeof firstName);
    console.log('lastName:', lastName, 'type:', typeof lastName);
    
    // Validate required fields
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      console.log('❌ Validation failed - missing fields');
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }
    
    // Check if user already exists
    const existingUser = await AppUser.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    // Create new user with pending status
    const user = new AppUser({
      email: email.toLowerCase(),
      password,
      name: `${firstName} ${lastName}`,
      status: 'pending'
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'Registration successful. Your account is pending approval.',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Login route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await AppUser.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check user status
    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval. Please wait for admin approval.',
        status: 'pending'
      });
    }
    
    if (user.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: `Your account has been rejected: ${user.rejectionReason || 'No reason provided'}`,
        status: 'rejected',
        rejectionReason: user.rejectionReason
      });
    }
    
    // User is approved, generate JWT token
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      status: user.status
    } as const;
    
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Logout route
router.post('/logout', async (req: Request, res: Response) => {
  try {
    res.clearCookie('userToken', {
      httpOnly: config.COOKIE_HTTP_ONLY,
      secure: config.COOKIE_SECURE,
      sameSite: config.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
      path: '/',
    });
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get current user route
router.get('/me', async (req: Request, res: Response) => {
  try {
    // Get token from cookie
    const token = req.cookies?.userToken;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET as jwt.Secret) as any;
    const user = await AppUser.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: {
          id: user._id,
          email: user.email,
          name: user.name,
          status: user.status,
          createdAt: user.createdAt
        }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
