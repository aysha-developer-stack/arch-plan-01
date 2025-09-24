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
        
        // Clear browser history when admin session is confirmed
        clearBrowserHistory();
      } catch (error) {
        // If not authenticated, redirect to login
        setIsAuthenticated(false);
        localStorage.removeItem('adminEmail');
        navigate('/admin/login', { replace: true });
      }
    };

    // Function to completely clear browser history
    const clearBrowserHistory = () => {
      // Clear the entire history stack by replacing all entries
      const clearHistoryStack = () => {
        // Get current location
        const currentLocation = window.location.pathname;
        
        // Replace the entire history with admin session
        window.history.replaceState(
          { adminSession: true, isRoot: true, preventBack: true }, 
          '', 
          currentLocation
        );
        
        // Add a barrier entry to prevent going back further
        window.history.pushState(
          { adminPortal: true, preventBack: true }, 
          '', 
          currentLocation
        );
      };
      
      clearHistoryStack();
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

  // Handle browser history and prevent back navigation to login
  useEffect(() => {
    if (isAuthenticated) {
      // Completely disable browser back button by creating a history trap
      const disableBackButton = () => {
        // Clear all previous history
        window.history.replaceState(null, '', window.location.href);
        
        // Create multiple history entries to trap the user
        for (let i = 0; i < 10; i++) {
          window.history.pushState(null, '', window.location.href);
        }
      };
      
      disableBackButton();
      
      // Disable browser navigation buttons by overriding history methods
      const originalPushState = window.history.pushState;
      const originalReplaceState = window.history.replaceState;
      const originalGo = window.history.go;
      const originalBack = window.history.back;
      const originalForward = window.history.forward;
      
      // Override all history navigation methods
      window.history.pushState = function(state: any, title: string, url?: string | URL | null) {
        if (url && typeof url === 'string' && !url.startsWith('/admin')) {
          return;
        }
        return originalPushState.call(this, state, title, url);
      };
      
      window.history.replaceState = function(state: any, title: string, url?: string | URL | null) {
        if (url && typeof url === 'string' && !url.startsWith('/admin')) {
          return;
        }
        return originalReplaceState.call(this, state, title, url);
      };
      
      // Completely disable back/forward navigation
      window.history.go = function(delta?: number) {
        // Block all history navigation
        return;
      };
      
      window.history.back = function() {
        // Block back navigation
        return;
      };
      
      window.history.forward = function() {
        // Block forward navigation
        return;
      };
      
      // Cleanup function to restore original methods
      return () => {
        window.history.pushState = originalPushState;
        window.history.replaceState = originalReplaceState;
        window.history.go = originalGo;
        window.history.back = originalBack;
        window.history.forward = originalForward;
      };
    }
  }, [isAuthenticated, location]);

  // Handle browser back/forward navigation and visibility changes
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Completely block all popstate events when authenticated
      if (isAuthenticated) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // Force user to stay on current page by recreating history trap
        window.history.replaceState(null, '', window.location.href);
        for (let i = 0; i < 5; i++) {
          window.history.pushState(null, '', window.location.href);
        }
        
        // Prevent any navigation attempt
        return false;
      }
    };
    
    const handleHashChange = (event: HashChangeEvent) => {
      // Completely block all hashchange events when authenticated
      if (isAuthenticated) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // Force user to stay on current page by recreating history trap
        window.history.replaceState(null, '', window.location.href);
        for (let i = 0; i < 5; i++) {
          window.history.pushState(null, '', window.location.href);
        }
        
        // Prevent any navigation attempt
        return false;
      }
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
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
      if (event.persisted && isAuthenticated) {
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

    // Add multiple event listeners to catch all navigation attempts
    window.addEventListener('popstate', handlePopState, true);
    window.addEventListener('hashchange', handleHashChange, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Additional navigation blocking
    const blockNavigation = (e: Event) => {
      if (isAuthenticated) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    
    // Block keyboard shortcuts that might trigger navigation
    const blockKeyboardNavigation = (e: KeyboardEvent) => {
      if (isAuthenticated) {
        // Block Alt+Left (back), Alt+Right (forward), Backspace (back)
        if ((e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) ||
            (e.key === 'Backspace' && e.target === document.body)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };
    
    document.addEventListener('keydown', blockKeyboardNavigation, true);
    window.addEventListener('beforeunload', blockNavigation, true);

    return () => {
      window.removeEventListener('popstate', handlePopState, true);
      window.removeEventListener('hashchange', handleHashChange, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('keydown', blockKeyboardNavigation, true);
      window.removeEventListener('beforeunload', blockNavigation, true);
    };
  }, [navigate, isAuthenticated, location]);

  // Handle manual navigation away from admin routes (not back button)
  useEffect(() => {
    // Only handle explicit navigation away from admin routes
    // This won't interfere with back button behavior
    if (!location.startsWith('/admin') && isAuthenticated) {
      // User manually navigated away from admin, clear session
      const adminEmail = localStorage.getItem('adminEmail');
      
      const clearSession = async () => {
        try {
          if (adminEmail) {
            await apiClient.post('/api/admin/clear-session', { email: adminEmail });
          }
        } catch (e) {
          console.debug('Failed to clear admin session:', e);
        }
        
        // Clear local storage and auth data
        localStorage.removeItem('adminEmail');
        setIsAuthenticated(false);
      };
      
      clearSession();
    }
  }, [location, isAuthenticated]);

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
      localStorage.removeItem('adminEmail');
      sessionStorage.clear();
      
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
      
      // Clear browser history to prevent back navigation to admin portal
      window.history.replaceState(null, '', '/admin/login');
      
      // Navigate to login page
      navigate('/admin/login', { replace: true });
      
    } catch (error) {
      console.error('Error during logout:', error);
      // Ensure we still navigate away even if there's an error
      localStorage.clear();
      sessionStorage.clear();
      setIsAuthenticated(false);
      window.history.replaceState(null, '', '/admin/login');
      navigate('/admin/login', { replace: true });
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
