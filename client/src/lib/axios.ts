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
    // Check for admin token first
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else {
      // Fallback to regular user token
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
      // Handle unauthorized access - clear both tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminEmail');
      
      // Redirect based on the current URL
      if (window.location.pathname.includes('/admin')) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { apiClient };
