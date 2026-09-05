import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Normalizes error shape so components can read err.message and err.status directly.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      (status === 0 || !error.response
        ? 'Cannot reach the server. Check your connection and try again.'
        : 'Something went wrong. Please try again.');
    return Promise.reject({ status, message, raw: error });
  }
);

export default api;
export { API_BASE_URL };
