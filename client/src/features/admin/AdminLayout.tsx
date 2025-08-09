import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { LogOut } from 'lucide-react';
import { apiClient } from '../../lib/axios';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const navigate = useLocation()[1];
  
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
      apiClient.defaults.headers.common['Authorization'] = '';
      
      // Navigate to login page
      navigate('/admin/login', { replace: true });
      
      // Force a hard refresh to ensure all state is cleared
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Error during logout:', error);
      // Ensure we still navigate away even if there's an error
      localStorage.removeItem('authToken');
      navigate('/admin/login', { replace: true });
    }
  };

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
              className="flex items-center gap-2 text-gray-700 hover:bg-gray-100"
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
