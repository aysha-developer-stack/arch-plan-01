import React from 'react';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { AlertCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/user/login' 
}) => {
  const { isAuthenticated, isLoading, user, logout } = useUserAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, setLocation]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // Check user approval status for authenticated users
  if (user && user.status !== 'approved') {
    if (user.status === 'pending') {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Account Pending Approval
            </h2>
            <p className="text-slate-600 mb-6">
              Your account is awaiting admin approval. Please wait for approval before accessing this page.
            </p>
            <Button 
              onClick={() => logout()}
              variant="outline"
              className="w-full"
            >
              Logout
            </Button>
          </div>
        </div>
      );
    }

    if (user.status === 'rejected') {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Account Rejected
            </h2>
            <p className="text-slate-600 mb-4">
              {user.rejectionReason || 'Your account has been rejected. Please contact support for more information.'}
            </p>
            <Button 
              onClick={() => logout()}
              variant="outline"
              className="w-full"
            >
              Logout
            </Button>
          </div>
        </div>
      );
    }
  }

  // Render children if authenticated and approved
  return <>{children}</>;
};

export default ProtectedRoute;