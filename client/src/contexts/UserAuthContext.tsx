import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../lib/axios';
import type { AppUserType } from '@shared/schema';

interface UserAuthContextType {
  user: AppUserType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: AppUserType; status?: string; rejectionReason?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
};

interface UserAuthProviderProps {
  children: ReactNode;
}

export const UserAuthProvider: React.FC<UserAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUserType | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      
      // Check if there's a token in localStorage or cookies before making API call
      const userEmail = localStorage.getItem('userEmail');
      const hasToken = document.cookie.includes('userToken=') || 
                      localStorage.getItem('userToken') || 
                      userEmail;
      
      if (!hasToken) {
        // No token found, user is not authenticated
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      const response = await apiClient.get('/api/auth/me');
      
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('userEmail');
      }
    } catch (error: any) {
      // Only log error if it's not a 401 (expected for unauthenticated users)
      if (error.response?.status !== 401) {
        console.error('Auth check failed:', error);
      }
      setUser(null);
      setIsAuthenticated(false);
      // Clear any stored user data
      localStorage.removeItem('userEmail');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        localStorage.setItem('userEmail', email);
        return { success: true, user: response.data.user };
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Login failed',
          status: response.data.status
        };
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      const status = error.response?.data?.status;
      const rejectionReason = error.response?.data?.rejectionReason;
      return { success: false, message, status, rejectionReason };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userEmail');
      // Clear any user-related data from localStorage
      localStorage.removeItem('userToken');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Clear browser history to prevent back button access to authenticated pages
      window.history.replaceState(null, '', '/login');
    }
  };

  const refreshUser = async () => {
    if (isAuthenticated) {
      await checkAuth();
    }
  };

  useEffect(() => {
    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value: UserAuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
    refreshUser,
  };

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
};

export default UserAuthContext;