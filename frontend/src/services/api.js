import axios from 'axios';

const API_URL = '/api';

// User API
export const userAPI = {
  getAll: () => axios.get(`${API_URL}/users`),
  getById: (id) => axios.get(`${API_URL}/users/${id}`),
  create: (data) => axios.post(`${API_URL}/users`, data),
  update: (id, data) => axios.put(`${API_URL}/users/${id}`, data),
  delete: (id) => axios.delete(`${API_URL}/users/${id}`)
};

// Habit API
export const habitAPI = {
  getByUser: (userId) => axios.get(`${API_URL}/habits/user/${userId}`),
  getById: (id) => axios.get(`${API_URL}/habits/${id}`),
  create: (data) => axios.post(`${API_URL}/habits`, data),
  update: (id, data) => axios.put(`${API_URL}/habits/${id}`, data),
  delete: (id) => axios.delete(`${API_URL}/habits/${id}`)
};

// Habit Record API
export const recordAPI = {
  getByHabit: (habitId) => axios.get(`${API_URL}/records/habit/${habitId}`),
  getByUser: (userId) => axios.get(`${API_URL}/records/user/${userId}`),
  getByRange: (userId, startDate, endDate) =>
    axios.get(`${API_URL}/records/user/${userId}/range?startDate=${startDate}&endDate=${endDate}`),
  create: (data) => axios.post(`${API_URL}/records`, data),
  delete: (id) => axios.delete(`${API_URL}/records/${id}`)
};
