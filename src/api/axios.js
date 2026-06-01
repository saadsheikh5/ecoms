import axios from 'axios';
import { API_BASE_URL, isApiConfigured, markApiAvailable, markApiUnavailable } from './status';

// Vite dev keeps a localhost default; production must provide the live API URL.

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 10000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
});

// Request Interceptor: Automatically inject secure JWT token if present
api.interceptors.request.use(
  (config) => {
    if (!isApiConfigured) {
      return Promise.reject(new Error('Live API URL is not configured.'));
    }

    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global error interceptor for easy debugging & UX error feedback
api.interceptors.response.use(
  (response) => {
    if (!response.config?.skipHealthUpdate) {
      markApiAvailable();
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    const isNetworkFailure = !error.response;
    const isServiceUnavailable = status === 500 || status === 502 || status === 503 || status === 504;
    const backendMessage = error.response?.data?.message;
    const errorMsg = isNetworkFailure
      ? isTimeout
        ? 'The API request timed out. Please try again when service is restored.'
        : 'The API server is unavailable. Please try again when service is restored.'
      : backendMessage || error.message || 'The API returned an unexpected error.';
    console.error('API Error:', errorMsg, error);

    if (!error.config?.skipHealthUpdate && (isNetworkFailure || isServiceUnavailable || isTimeout)) {
      markApiUnavailable(errorMsg);
    }
    
    if (status === 401 && !error.config?.preserveAdminSessionOnAuthError) {
      localStorage.removeItem('adminToken');
    }
    
    const normalizedError = new Error(errorMsg);
    normalizedError.status = status;
    normalizedError.code = error.code;
    normalizedError.isTimeout = isTimeout;
    normalizedError.isBackendUnavailable = isNetworkFailure || isServiceUnavailable || isTimeout;
    normalizedError.isApiUnavailable = normalizedError.isBackendUnavailable;
    return Promise.reject(normalizedError);
  }
);

export default api;
