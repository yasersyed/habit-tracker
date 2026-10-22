import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only a request that carried a token means the session expired; a 401
    // without one is a failed login whose message the form needs to show.
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me')
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  changePassword: (data) => api.put('/users/me/password', data),
  deleteAccount: () => api.delete('/users/me')
};

// Habit API
export const habitAPI = {
  getAll: ({ archived } = {}) =>
    api.get(`/habits${archived ? '?archived=true' : ''}`),
  getById: (id) => api.get(`/habits/${id}`),
  create: (data) => api.post('/habits', data),
  update: (id, data) => api.put(`/habits/${id}`, data),
  archive: (id) => api.put(`/habits/${id}/archive`),
  unarchive: (id) => api.put(`/habits/${id}/unarchive`),
  delete: (id) => api.delete(`/habits/${id}`),
  // `today` anchors the current-streak boundary to the client's local day.
  getStreaks: (today) => api.get(`/habits/streaks?today=${today}`),
  getStreak: (id, today) => api.get(`/habits/${id}/streak?today=${today}`)
};

// Habit Record API
export const recordAPI = {
  getByHabit: (habitId, { startDate, endDate } = {}) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    params.set('limit', '100');
    return api.get(`/records/habit/${habitId}?${params.toString()}`);
  },
  getAll: () => api.get('/records'),
  getByRange: (startDate, endDate, { page, limit } = {}) => {
    const params = new URLSearchParams({ startDate, endDate });
    if (page) params.set('page', page);
    params.set('limit', String(limit || 100));
    return api.get(`/records/range?${params.toString()}`);
  },
  // Long ranges can span several pages; walk all of them so callers don't
  // silently see a truncated history.
  getAllInRange: async (startDate, endDate) => {
    const all = [];
    let page = 1;
    let totalPages = 1;
    do {
      const response = await recordAPI.getByRange(startDate, endDate, { page, limit: 100 });
      all.push(...response.data);
      totalPages = Number(response.headers['x-total-pages']) || 1;
      page++;
    } while (page <= totalPages);
    return all;
  },
  create: (data) => api.post('/records', data),
  delete: (id) => api.delete(`/records/${id}`)
};

// Statistics API — all accept a { startDate, endDate } range (YYYY-MM-DD).
const rangeQuery = ({ startDate, endDate } = {}) => {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const q = params.toString();
  return q ? `?${q}` : '';
};

export const statsAPI = {
  getSummary: (range) => api.get(`/stats/summary${rangeQuery(range)}`),
  getDaily: (range) => api.get(`/stats/daily${rangeQuery(range)}`),
  getHabits: (range) => api.get(`/stats/habits${rangeQuery(range)}`)
};

// Export API
export const exportAPI = {
  download: (format) => api.get(`/export?format=${format}`, { responseType: 'blob' })
};
