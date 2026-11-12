import axios from 'axios';

/**
 * Central Axios Instance for LeadFlow
 * 
 * Token Storage Choice:
 * In this academic project, the Sanctum personal access token is stored in `localStorage` 
 * under the key 'leadflow_token'.
 * 
 * Limitations & Security Notes:
 * Storing tokens in `localStorage` makes them accessible to JavaScript running in the same origin. 
 * While simpler and ideal for decoupled REST API development in an educational/demo environment,
 * production enterprise applications typically prefer httpOnly Secure cookies or in-memory 
 * token management with refresh token rotation to mitigate Cross-Site Scripting (XSS) risks.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Attach Bearer token to all outgoing requests if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('leadflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle global 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid, expired, or revoked
      localStorage.removeItem('leadflow_token');
      localStorage.removeItem('leadflow_user');
    }
    return Promise.reject(error);
  }
);

export default api;
