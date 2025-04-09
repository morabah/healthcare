import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getAuth } from 'firebase/auth';

// Define API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// Create custom axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      // If user is logged in, add token to request
      if (user) {
        const token = await user.getIdToken();
        config.headers.set('Authorization', `Bearer ${token}`);
      }
      
      return config;
    } catch (error) {
      console.error('Error adding auth token to request:', error);
      return config;
    }
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      const status = error.response.status;
      
      switch (status) {
        case 401:
          // Unauthorized - handle auth errors (e.g., redirect to login)
          console.error('Authentication error:', error.response.data);
          // Could dispatch to auth context or redirect
          break;
        case 403:
          // Forbidden - handle permission errors
          console.error('Permission denied:', error.response.data);
          break;
        case 404:
          // Not found
          console.error('Resource not found:', error.response.data);
          break;
        case 500:
          // Server error
          console.error('Server error:', error.response.data);
          break;
        default:
          console.error(`Error ${status}:`, error.response.data);
      }
    } else if (error.request) {
      // Request was made but no response was received - likely backend not running
      if (error.message === 'Network Error') {
        console.warn('Backend API not available. This is expected if you haven\'t set up the backend yet.');
      } else {
        console.warn('No response received from API. Fallback mechanisms will be used if available.');
      }
    } else {
      // Error setting up the request
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
