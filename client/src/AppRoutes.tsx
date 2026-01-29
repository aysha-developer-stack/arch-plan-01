import { Route, Switch } from 'wouter';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useEffect } from 'react';
import { useLocation } from 'wouter';

// Admin components
import AdminLogin from '@/features/admin/AdminLogin';
import AdminLayout from '@/features/admin/AdminLayout';
import AdminDashboard from '@/features/admin/pages/Dashboard';

// Public components
import Landing from '@/pages/landing';
import Home from '@/pages/home';
import SearchInterface from '@/components/SearchInterface';
import Logout from '@/components/Logout';
import NotFound from '@/pages/not-found';
import { AuthPage } from '@/pages/AuthPage';
import UserSignup from '@/components/UserSignup';
import UserLogin from '@/components/UserLogin';
import ForgotPassword from '@/components/ForgotPassword';
import ResetPassword from '@/components/ResetPassword';
import UserDashboard from '@/pages/UserDashboard';

// Admin Routes Component with Authentication
const AdminRoutes = () => {
  const [location] = useLocation();
  const [, navigate] = useLocation();

  // Only check auth if not on login page to prevent loops
  const shouldCheckAuth = location !== '/admin/login';
  const { isAuthenticated, isLoading } = useAdminAuth({ skipAuthCheck: !shouldCheckAuth });

  useEffect(() => {
    // Only redirect if we're checking auth and not loading
    if (shouldCheckAuth && !isLoading && !isAuthenticated) {
      navigate('/admin/login');
    } else if (isAuthenticated && location === '/admin/login') {
      // Check if there's a redirect parameter
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirect');
      
      if (redirectTo === 'app') {
        navigate('/app');
      } else {
        navigate('/admin');
      }
    }
  }, [isAuthenticated, isLoading, navigate, location, shouldCheckAuth]);

  // Only show loading for non-login admin routes
  if (isLoading && shouldCheckAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">
        {isAuthenticated ? (
          <AdminLayout>
            <Switch>
              <Route path="/admin" component={AdminDashboard} />
              <Route component={NotFound} />
            </Switch>
          </AdminLayout>
        ) : (
          <AdminLogin />
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
};

// Public Routes Component with User Authentication
const PublicRoutes = () => {
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading } = useUserAuth();

  // Check if user is trying to access protected routes
  const isProtectedRoute = location === '/app' || location === '/search';
  const shouldCheckAuth = isProtectedRoute;

  // Removed automatic redirect to /auth - allow direct access to /app and /search
  // Users can access these routes directly without forced authentication redirects

  if (isLoading && shouldCheckAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/signup" component={UserSignup} />
      <Route path="/login" component={UserLogin} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/dashboard" component={UserDashboard} />
      <Route path="/app" component={Home} />
      <Route path="/search" component={SearchInterface} />
      <Route path="/logout" component={Logout} />
      <Route component={NotFound} />
    </Switch>
  );
};

const AppRoutes = () => {
  const [location] = useLocation();

  // Completely separate admin routes from public routes
  const isAdminRoute = location.startsWith('/admin');

  // Only render admin routes with auth logic
  if (isAdminRoute) {
    return <AdminRoutes />;
  }

  // Render public routes without any auth logic
  return <PublicRoutes />;
};

export default AppRoutes;
