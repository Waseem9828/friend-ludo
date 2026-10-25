import axios from 'axios';

// Obscure system operations base path without 'admin' in the name
export const SYSTEM_OPS_BASE = '/api/v1/core-sys-ops';

// Base API URL: uses VITE_API_URL if defined, otherwise uses the obscure system operations gateway
const API_BASE_URL = import.meta.env?.VITE_API_URL || SYSTEM_OPS_BASE;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to attach JWT token and normalize unknown endpoint routing
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['x-auth-token'] = token;
      config.headers['x-system-key'] = token;
    }
    // Automatically rewrite legacy '/admin' paths so all network requests hit the obscure /api/v1/core-sys-ops gateway
    if (config.url) {
      if (config.url.startsWith('/admin/')) {
        config.url = config.url.replace(/^\/admin/, '');
      } else if (config.url === '/admin') {
        config.url = '';
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global console helper
if (typeof window !== 'undefined') {
  if (!window.getFailedApiRequests) {
    window.getFailedApiRequests = function() {
      try {
        return JSON.parse(sessionStorage.getItem('failed_api_requests') || '[]');
      } catch (e) {
        return [];
      }
    };
  }
  if (!window.clearFailedApiRequests) {
    window.clearFailedApiRequests = function() {
      sessionStorage.removeItem('failed_api_requests');
      console.info('[API Logger] Cleared failed API requests from sessionStorage.');
    };
  }
}

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      if (window.location.pathname !== '/admin/login' && window.location.pathname !== '/admin/register') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
