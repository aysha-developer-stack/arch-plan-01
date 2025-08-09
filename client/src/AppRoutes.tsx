import { Route, Switch } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
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

// Admin Routes Component with Authentication
const AdminRoutes = () => {
  const [location] = useLocation();
  const [, navigate] = useLocation();
  
  // Only check auth if not on login page to prevent loops
  const shouldCheckAuth = location !== '/admin/login';
  const { isAuthenticated, isLoading } = useAuth({ skipAuthCheck: !shouldCheckAuth });

  useEffect(() => {
    // Only redirect if we're checking auth and not loading
    if (shouldCheckAuth && !isLoading && !isAuthenticated) {
      navigate('/admin/login');
    } else if (isAuthenticated && location === '/admin/login') {
      navigate('/admin');
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

// Public Routes Component (No Authentication)
const PublicRoutes = () => {
  return (
    <Switch>
      <Route path="/" component={Landing} />
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
