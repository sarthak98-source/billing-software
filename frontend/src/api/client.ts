/**
 * api/client.ts — Axios instance with JWT interceptor
 * All API calls go through this client.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token automatically on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('billcraft_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('billcraft_token');
      localStorage.removeItem('billcraft_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  },
);

export default api;
