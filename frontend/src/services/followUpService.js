import api from './api';

const followUpService = {
  /**
   * Fetch paginated follow-ups with optional filters:
   * search, lead_id, created_by, page, per_page.
   * @param {Object} params
   */
  async getFollowUps(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.lead_id) query.append('lead_id', params.lead_id);
    if (params.created_by) query.append('created_by', params.created_by);
    if (params.page) query.append('page', params.page);
    if (params.per_page) query.append('per_page', params.per_page);

    const qs = query.toString();
    const endpoint = `/follow-ups${qs ? `?${qs}` : ''}`;
    const response = await api.get(endpoint);
    return response.data;
  },

  /**
   * Fetch single follow-up details by ID.
   * @param {number|string} id
   */
  async getFollowUp(id) {
    const response = await api.get(`/follow-ups/${id}`);
    return response.data;
  },

  /**
   * Create a new follow-up.
   * @param {Object} data - { lead_id, follow_up_date, remarks, next_follow_up_date }
   */
  async createFollowUp(data) {
    const response = await api.post('/follow-ups', data);
    return response.data;
  },

  /**
   * Update an existing follow-up.
   * @param {number|string} id
   * @param {Object} data - { follow_up_date, remarks, next_follow_up_date }
   */
  async updateFollowUp(id, data) {
    const response = await api.put(`/follow-ups/${id}`, data);
    return response.data;
  },

  /**
   * Delete a follow-up (Admin only).
   * @param {number|string} id
   */
  async deleteFollowUp(id) {
    const response = await api.delete(`/follow-ups/${id}`);
    return response.data;
  },

  /**
   * Fetch follow-up history for a specific lead.
   * @param {number|string} leadId
   */
  async getLeadFollowUps(leadId) {
    const response = await api.get(`/leads/${leadId}/follow-ups`);
    return response.data;
  },
};

export default followUpService;

