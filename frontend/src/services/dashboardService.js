import api from './api';

const dashboardService = {
  /**
   * Fetch summarized lead and follow-up metrics.
   */
  async getSummary() {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },

  /**
   * Fetch recent leads list.
   * @param {number} limit 
   */
  async getRecentLeads(limit = 5) {
    const response = await api.get(`/dashboard/recent-leads?limit=${limit}`);
    return response.data;
  },

  /**
   * Fetch scheduled follow-ups by period.
   * @param {string} period 'today' | 'upcoming' | 'overdue'
   * @param {number} page
   * @param {number} perPage
   */
  async getFollowUps(period = 'today', page = 1, perPage = 10) {
    const response = await api.get(`/dashboard/follow-ups?period=${period}&page=${page}&per_page=${perPage}`);
    return response.data;
  },
};

export default dashboardService;

