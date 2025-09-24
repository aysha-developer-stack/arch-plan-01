import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { apiClient } from '../lib/axios';

export const useAuth = (options: { skipAuthCheck?: boolean } = {}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!options.skipAuthCheck);
  const [, navigate] = useLocation();

  const checkAuth = useCallback(async () => {
    if (options.skipAuthCheck) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.get('/api/auth/user');
      const userData = response.data;
      setIsAuthenticated(!!userData);
      setUser(userData || null);
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, options.skipAuthCheck]);

  useEffect(() => {
    if (!options.skipAuthCheck) {
      checkAuth();
    }
  }, [checkAuth, options.skipAuthCheck]);

  return { isAuthenticated, user, isLoading, checkAuth };
};
