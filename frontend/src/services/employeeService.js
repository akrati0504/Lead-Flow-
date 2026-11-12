import api from './api';

/**
 * Employee Management Service (Admin only)
 * Endpoints under /api/admin/employees
 */
export const employeeService = {
  /**
   * Fetch paginated employees with optional query filters:
   * @param {Object} params
   * @param {string} [params.search] - Search by name or email
   * @param {boolean|string} [params.is_active] - Filter by active status (true, false, '1', '0')
   * @param {number} [params.page] - Page number
   * @param {number} [params.per_page] - Records per page
   */
  async getEmployees(params = {}) {
    const response = await api.get('/admin/employees', { params });
    return response.data;
  },

  /**
   * Fetch single employee details by ID
   * @param {number|string} id
   */
  async getEmployee(id) {
    const response = await api.get(`/admin/employees/${id}`);
    return response.data;
  },

  /**
   * Create a new employee
   * @param {Object} data
   * @param {string} data.name
   * @param {string} data.email
   * @param {string} data.password
   * @param {string} data.password_confirmation
   * @param {boolean} [data.is_active=true]
   */
  async createEmployee(data) {
    const response = await api.post('/admin/employees', data);
    return response.data;
  },

  /**
   * Update existing employee details
   * @param {number|string} id
   * @param {Object} data
   * @param {string} [data.name]
   * @param {string} [data.email]
   * @param {string} [data.password] - Optional new password
   * @param {string} [data.password_confirmation]
   * @param {boolean} [data.is_active]
   */
  async updateEmployee(id, data) {
    const response = await api.put(`/admin/employees/${id}`, data);
    return response.data;
  },

  /**
   * Toggle employee active status (Deactivate / Activate)
   * @param {number|string} id
   * @param {boolean} isActive
   */
  async toggleActiveStatus(id, isActive) {
    const response = await api.put(`/admin/employees/${id}`, { is_active: isActive });
    return response.data;
  },
};

export default employeeService;

