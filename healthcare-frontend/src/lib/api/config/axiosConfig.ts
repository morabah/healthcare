import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getAuth } from 'firebase/auth';

// Define API base URL from environment variables
// Make sure the port matches your NestJS backend port (typically 3000 or 3001)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Create axios instance with base URL and default headers
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 10000,
});

// Configure request retry mechanism
interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryStatusCodes: number[];
}

const retryConfig: RetryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
};

// Track ongoing token refresh operation to prevent multiple concurrent refreshes
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Request interceptor to add auth token to headers
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Only add authorization headers to our API requests
    if (config.url?.startsWith(API_BASE_URL) || !config.url?.startsWith('http')) {
      try {
        // Get the current Firebase user (if authenticated)
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
          try {
            // Get the user's ID token
            let token = await user.getIdToken(false);
            
            // If token is expired or about to expire, force refresh
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = decodedToken.exp * 1000; // Convert to milliseconds
            
            // If token is within 5 minutes of expiry, refresh it
            if (Date.now() + 5 * 60 * 1000 > expirationTime) {
              if (!isRefreshing) {
                isRefreshing = true;
                refreshPromise = user.getIdToken(true)
                  .then(newToken => {
                    return newToken;
                  })
                  .catch(error => {
                    console.error('Error refreshing token:', error);
                    return null;
                  })
                  .finally(() => {
                    isRefreshing = false;
                    refreshPromise = null;
                  });
              }
              
              // Wait for the refresh to complete
              if (refreshPromise) {
                const newToken = await refreshPromise;
                if (newToken) {
                  token = newToken;
                }
              }
            }
            
            config.headers.Authorization = `Bearer ${token}`;
          } catch (error) {
            console.error('Error getting auth token:', error);
          }
        }
      } catch (error) {
        console.error('Error setting auth headers:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and retry logic
apiClient.interceptors.response.use(
  // For successful responses, just return the response
  (response: AxiosResponse) => response,
  
  // For errors, handle appropriately
  async (error: AxiosError) => {
    // Get the original request config
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }
    
    // Get retry count from request or initialize it
    const retryCount = originalRequest.headers['x-retry-count'] ? 
      parseInt(originalRequest.headers['x-retry-count'] as string, 10) : 0;
    
    // Check if we should retry the request
    if (
      error.response &&
      retryConfig.retryStatusCodes.includes(error.response.status) &&
      retryCount < retryConfig.retries
    ) {
      // Increment retry count
      originalRequest.headers['x-retry-count'] = (retryCount + 1).toString();
      
      // Wait before retrying (with exponential backoff)
      const delay = retryConfig.retryDelay * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the request
      return apiClient(originalRequest);
    }
    
    // If we have a response, handle different status codes
    if (error.response) {
      const status = error.response.status;
      
      switch (status) {
        case 401:
          // Unauthorized - handle authentication errors
          console.warn('Authentication required. User may need to log in again.');
          
          // You could trigger a logout or force re-authentication here
          break;
        case 403:
          // Forbidden - handle permission errors
          console.error('Permission denied:', error.response.data);
          break;
        case 404:
          // Not found - Use warn instead of error since we often have fallback mechanisms
          console.warn('Resource not found, will attempt fallback if available:', error.response.statusText);
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
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
