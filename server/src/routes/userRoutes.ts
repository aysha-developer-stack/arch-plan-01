import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticateUser } from '../middleware/userAuthMiddleware';
import { supabase } from '../../db';
import { z } from 'zod';

// Define schemas locally
const appUserSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2)
});

const appUserLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const router = Router();

// User signup route
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const validatedData = appUserSignupSchema.parse(req.body);
    const { email, password, name } = validatedData;

    // Use admin.createUser to bypass email confirmation
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        name
      }
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    if (data.user) {
      const { error: insertError } = await supabase
        .from('app_users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: name,
          status: 'pending'
        });

      if (insertError) {
        console.error('Error creating app_user profile:', insertError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully. You can now log in.',
      data
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
    res.status(500).json({ success: false, message: 'Server error during signup' });
  }
});

// User login route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validatedData = appUserLoginSchema.parse(req.body);
    const { email, password } = validatedData;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ success: false, message: error.message });
    }

    const { session, user } = data;

    // Get the user profile from the app_users table
    let { data: appUser, error: profileError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !appUser) {
      // Try to create the profile if it doesn't exist
      console.log('User profile not found, attempting to create one for:', user.id);
      
      const { data: newProfile, error: createError } = await supabase
        .from('app_users')
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          status: 'pending'
        })
        .select()
        .single();
        
      if (createError || !newProfile) {
        console.error('Failed to create user profile:', createError);
        return res.status(401).json({
          success: false,
          message: 'User profile not found and could not be created. Please contact support.'
        });
      }
      
      appUser = newProfile;
    }

    // Check if user is approved
    if (appUser.status !== 'approved') {
      let message = 'Account access denied.';
      if (appUser.status === 'pending') {
        message = 'Your account is awaiting admin approval.';
      } else if (appUser.status === 'rejected') {
        message = appUser.rejection_reason || 'Your account has been rejected. Please contact support.';
      }
      
      return res.status(403).json({ 
        success: false, 
        message,
        status: appUser.status,
        rejectionReason: appUser.status === 'rejected' ? appUser.rejection_reason : undefined
      });
    }

    res.cookie('supabase-auth-token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: session.expires_in * 1000
    });

    // Return the complete user data including name from app_users table
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: appUser.name,
        status: appUser.status,
        token: session.access_token,
        downloadCount: 0 // Default value for compatibility
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
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// User logout route
router.post('/logout', async (req: Request, res: Response) => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return res.status(500).json({ success: false, message: error.message });
  }

  res.clearCookie('supabase-auth-token');
  res.status(200).json({ success: true, message: 'Logout successful' });
});

// Get current user profile (authenticated users only)
router.get('/me', authenticateUser, async (req: Request, res: Response) => {
  try {
    // The user is already fetched in the authenticateUser middleware
    // and attached to req.appUser, so we can just return it
    if (!req.appUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: req.appUser
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get user download count (authenticated users only)
router.get('/me/downloads', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.appUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // For now, return a default download count since the column doesn't exist yet
    // Once the download_count column is added to the database, this will use: req.appUser.download_count || 0
    const downloadCount = 0; // Temporary default value

    res.status(200).json({
      success: true,
      downloadCount: downloadCount
    });
  } catch (error) {
    console.error('Get user downloads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;