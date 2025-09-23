import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (
    import.meta.env.PROD 
      ? '' // Use same domain for production (no CORS issues)
      : 'http://localhost:5000'
  ),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // For admin routes, rely on cookies only (no Authorization header)
    if (config.url?.includes('/admin/')) {
      // Admin routes use cookie-based authentication only
      // Remove any Authorization header that might interfere
      delete config.headers.Authorization;
    } else {
      // For regular user routes, use token-based authentication
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized
type ErrorResponse = {
  response?: {
    status: number;
    data: {
      message?: string;
    };
  };
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: ErrorResponse) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (window.location.pathname.includes('/admin')) {
        // For admin routes, clear admin-related data
        localStorage.removeItem('adminEmail');
        window.location.href = '/admin/login';
      } else {
        // For regular user routes, clear user token
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { apiClient };
