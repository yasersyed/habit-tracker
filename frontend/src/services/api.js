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
    if (error.response?.status === 401) {
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
  updateProfile: (data) => api.put('/users/me', data)
};

// Habit API
export const habitAPI = {
  getAll: () => api.get('/habits'),
  getById: (id) => api.get(`/habits/${id}`),
  create: (data) => api.post('/habits', data),
  update: (id, data) => api.put(`/habits/${id}`, data),
  delete: (id) => api.delete(`/habits/${id}`)
};

// Habit Record API
export const recordAPI = {
  getByHabit: (habitId) => api.get(`/records/habit/${habitId}`),
  getAll: () => api.get('/records'),
  getByRange: (startDate, endDate) =>
    api.get(`/records/range?startDate=${startDate}&endDate=${endDate}`),
  create: (data) => api.post('/records', data),
  delete: (id) => api.delete(`/records/${id}`)
};
