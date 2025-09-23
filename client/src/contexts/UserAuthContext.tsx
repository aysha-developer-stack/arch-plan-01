import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
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
      
      // Get the current user session from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        // No session found, user is not authenticated
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      // Get the user data from Supabase
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !authUser) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      // Get the user profile from the users table
      const { data: profile, error: profileError } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (profileError || !profile) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      // Check if user is approved
      if (profile.status !== 'approved') {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      // Set the user data
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        name: profile.name,
        status: profile.status,
        ...profile
      } as AppUserType);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { 
          success: false, 
          message: error.message || 'Login failed'
        };
      }
      
      if (!data.user) {
        return { 
          success: false, 
          message: 'Login failed. User not found.'
        };
      }
      
      // Get the user profile from the users table
      const { data: profile, error: profileError } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError || !profile) {
        return { 
          success: false, 
          message: 'Login failed. User profile not found.'
        };
      }
      
      // Check if user is approved
      if (profile.status !== 'approved') {
        return { 
          success: false, 
          message: 'Your account is not approved yet.',
          status: profile.status,
          rejectionReason: profile.rejection_reason
        };
      }
      
      // Set the user data
      const userData = {
        id: data.user.id,
        email: data.user.email || '',
        name: profile.name,
        status: profile.status,
        ...profile
      } as AppUserType;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.message || 'Login failed'
      };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      
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
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: any) => {
      if (session) {
        checkAuth();
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
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