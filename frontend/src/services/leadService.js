import api from './api';

const leadService = {
  /**
   * Fetch paginated leads with optional search, status, and assigned_to filters.
   * @param {Object} params - { search, status, assigned_to, page, per_page }
   */
  async getLeads(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.assigned_to) query.append('assigned_to', params.assigned_to);
    if (params.page) query.append('page', params.page);
    if (params.per_page) query.append('per_page', params.per_page);

    const qs = query.toString();
    const endpoint = `/leads${qs ? `?${qs}` : ''}`;
    const response = await api.get(endpoint);
    return response.data;
  },

  /**
   * Fetch single lead details by ID.
   * @param {number|string} id 
   */
  async getLead(id) {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },

  /**
   * Create a new lead.
   * @param {Object} data 
   */
  async createLead(data) {
    const response = await api.post('/leads', data);
    return response.data;
  },

  /**
   * Update an existing lead.
   * @param {number|string} id 
   * @param {Object} data 
   */
  async updateLead(id, data) {
    const response = await api.put(`/leads/${id}`, data);
    return response.data;
  },

  /**
   * Delete a lead (Admin only).
   * @param {number|string} id 
   */
  async deleteLead(id) {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  },
};

export default leadService;

