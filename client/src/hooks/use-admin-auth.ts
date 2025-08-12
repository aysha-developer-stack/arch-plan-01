import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/axios';

export const useAdminAuth = (options: { skipAuthCheck?: boolean } = {}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(!options.skipAuthCheck);

  const checkAuth = useCallback(async () => {
    if (options.skipAuthCheck) {
      setIsLoading(false);
      return;
    }

    try {
      // Use the admin authentication endpoint
      await apiClient.get('/api/admin/check-auth');
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      // Clear admin email from localStorage if auth fails
      localStorage.removeItem('adminEmail');
    } finally {
      setIsLoading(false);
    }
  }, [options.skipAuthCheck]);

  useEffect(() => {
    if (!options.skipAuthCheck) {
      checkAuth();
    }
  }, [checkAuth, options.skipAuthCheck]);

  return { isAuthenticated, isLoading, checkAuth };
};
