import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { LogOut } from 'lucide-react';
import { apiClient } from '../../lib/axios';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { Loader2 } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [location, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const authCheckInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Prevent browser caching of admin pages
  useEffect(() => {
    // Set cache control headers to prevent caching
    const preventCaching = () => {
      // Add meta tags to prevent caching
      const metaTags = [
        { name: 'Cache-Control', content: 'no-cache, no-store, must-revalidate' },
        { name: 'Pragma', content: 'no-cache' },
        { name: 'Expires', content: '0' }
      ];
      
      metaTags.forEach(({ name, content }) => {
        let meta = document.querySelector(`meta[http-equiv="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('http-equiv', name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      });
    };

    preventCaching();

    // Cleanup on unmount
    return () => {
      const metaTags = ['Cache-Control', 'Pragma', 'Expires'];
      metaTags.forEach(name => {
        const meta = document.querySelector(`meta[http-equiv="${name}"]`);
        if (meta) {
          meta.remove();
        }
      });
    };
  }, []);

  // Check authentication status on mount and periodically
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiClient.get('/api/admin/check-auth');
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (error) {
        // If not authenticated, redirect to login
        setIsAuthenticated(false);
        localStorage.removeItem('adminEmail');
        navigate('/admin/login', { replace: true });
      }
    };

    // Initial auth check
    checkAuth();

    // Set up periodic auth checks every 30 seconds
    authCheckInterval.current = setInterval(checkAuth, 30000);

    // Cleanup interval on unmount
    return () => {
      if (authCheckInterval.current) {
        clearInterval(authCheckInterval.current);
      }
    };
  }, [navigate]);

  // Handle browser back/forward navigation and visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // Re-check authentication when page becomes visible
        try {
          await apiClient.get('/api/admin/check-auth');
          setIsAuthenticated(true);
        } catch (error) {
          setIsAuthenticated(false);
          localStorage.removeItem('adminEmail');
          navigate('/admin/login', { replace: true });
        }
      }
    };

    const handlePageShow = async (event: PageTransitionEvent) => {
      // Handle browser back button - re-check auth if page was loaded from cache
      if (event.persisted) {
        try {
          await apiClient.get('/api/admin/check-auth');
          setIsAuthenticated(true);
        } catch (error) {
          setIsAuthenticated(false);
          localStorage.removeItem('adminEmail');
          navigate('/admin/login', { replace: true });
        }
      }
    };

    const handleBeforeUnload = () => {
      // Clear any cached data before page unload
      if (window.performance) {
        window.performance.mark('admin-logout');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [navigate]);

  // Auto-logout when navigating away from admin routes
  useEffect(() => {
    // Get current admin email for session clearing
    const adminEmail = localStorage.getItem('adminEmail');
    
    const handleRouteChange = async (newLocation: string) => {
      // If the new location is not under /admin, log out
      if (!newLocation.startsWith('/admin')) {
        try {
          // Clear the admin session on the server
          if (adminEmail) {
            try {
              await apiClient.post('/api/admin/clear-session', { email: adminEmail });
            } catch (e) {
              console.debug('Failed to clear admin session:', e);
            }
          }
          
          // Clear local storage and auth data
          localStorage.removeItem('authToken');
          localStorage.removeItem('adminEmail');
          apiClient.defaults.headers.common['Authorization'] = '';
          
          // Navigate to login page
          navigate('/admin/login', { replace: true });
          
          // Force a hard refresh to ensure all state is cleared
          window.location.href = '/admin/login';
        } catch (error) {
          console.error('Error during logout:', error);
          // Ensure we still navigate away even if there's an error
          navigate('/admin/login', { replace: true });
        }
      }
    };

    // Set up a listener for route changes
    const unlisten = () => {
      window.addEventListener('popstate', () => {
        handleRouteChange(window.location.pathname);
      });
      
      // Cleanup
      return () => {
        window.removeEventListener('popstate', () => {
          handleRouteChange(window.location.pathname);
        });
      };
    };

    // Initial check in case the component mounts on a non-admin route
    if (!location.startsWith('/admin')) {
      handleRouteChange(location);
    }

    return unlisten();
  }, [location]);

  const handleLogout = async () => {
    try {
      // Clear periodic auth check
      if (authCheckInterval.current) {
        clearInterval(authCheckInterval.current);
      }

      // Call backend logout endpoint to clear HTTP-only cookies
      try {
        await apiClient.post('/api/admin/logout');
      } catch (e) {
        console.debug('Backend logout failed:', e);
      }

      const adminEmail = localStorage.getItem('adminEmail');
      
      // Clear the admin session on the server
      if (adminEmail) {
        try {
          await apiClient.post('/api/admin/clear-session', { email: adminEmail });
        } catch (e) {
          console.debug('Failed to clear admin session:', e);
        }
      }
      
      // Clear local storage and auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('adminEmail');
      sessionStorage.clear();
      apiClient.defaults.headers.common['Authorization'] = '';
      
      // Set authentication state to false
      setIsAuthenticated(false);
      
      // Clear browser cache and history
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      
      // Navigate to login page and replace history
      navigate('/admin/login', { replace: true });
      
      // Force a hard refresh to ensure all state is cleared and prevent back button access
      setTimeout(() => {
        window.location.replace('/admin/login');
      }, 100);
    } catch (error) {
      console.error('Error during logout:', error);
      // Ensure we still navigate away even if there's an error
      localStorage.clear();
      sessionStorage.clear();
      setIsAuthenticated(false);
      window.location.replace('/admin/login');
    }
  };

  // Show loading screen while checking authentication
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between h-16 items-center">
            <Link href="/admin">
              <span className="text-xl font-semibold text-gray-900">Admin Portal</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <Toaster />
    </div>
  );
};

export default AdminLayout;
