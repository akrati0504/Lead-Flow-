import api from './api';

const authService = {
  /**
   * Log in user and return response data.
   * @param {Object} credentials - { email, password }
   */
  async login(credentials) {
    const response = await api.post('/login', credentials);
    return response.data;
  },

  /**
   * Revoke current access token.
   */
  async logout() {
    const response = await api.post('/logout');
    return response.data;
  },

  /**
   * Fetch authenticated user details.
   */
  async getCurrentUser() {
    const response = await api.get('/user');
    return response.data;
  },

  /**
   * Admin-only test endpoint probe.
   */
  async testAdminAccess() {
    const response = await api.get('/admin/test');
    return response.data;
  },

  /**
   * Employee-only test endpoint probe.
   */
  async testEmployeeAccess() {
    const response = await api.get('/employee/test');
    return response.data;
  },
};

export default authService;

