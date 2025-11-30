import { supabase } from '../../db';
export const authenticateUser = async (req, res, next) => {
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
        // Fetch user profile from your public.users table
        const { data: appUser, error: profileError } = await supabase
            .from('users')
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
            }
            else if (appUser.status === 'rejected') {
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
        req.appUser = appUser;
        next();
    }
    catch (error) {
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
//# sourceMappingURL=userAuthMiddleware.js.map