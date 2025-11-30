import { Router } from 'express';
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
router.post('/signup', async (req, res) => {
    try {
        const validatedData = appUserSignupSchema.parse(req.body);
        const { email, password, name } = validatedData;
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name
                }
            }
        });
        if (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(201).json({
            success: true,
            message: 'Account created successfully. Please check your email to verify your account.',
            data
        });
    }
    catch (error) {
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
router.post('/login', async (req, res) => {
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
        res.cookie('supabase-auth-token', session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: session.expires_in * 1000
        });
        res.status(200).json({
            success: true,
            message: 'Login successful',
            user
        });
    }
    catch (error) {
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
router.post('/logout', async (req, res) => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
    res.clearCookie('supabase-auth-token');
    res.status(200).json({ success: true, message: 'Logout successful' });
});
// Get current user profile (authenticated users only)
router.get('/me', authenticateUser, async (req, res) => {
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
    }
    catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
export default router;
//# sourceMappingURL=userRoutes.js.map