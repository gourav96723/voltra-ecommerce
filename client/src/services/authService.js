import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  getMe: () => api.get('/auth/me').then((r) => r.data),
  updateProfile: (data) => api.patch('/auth/profile', data).then((r) => r.data),
  changePassword: (data) => api.patch('/auth/change-password', data).then((r) => r.data),
  listAddresses: () => api.get('/auth/addresses').then((r) => r.data),
  addAddress: (data) => api.post('/auth/addresses', data).then((r) => r.data),
  updateAddress: (id, data) => api.patch(`/auth/addresses/${id}`, data).then((r) => r.data),
  deleteAddress: (id) => api.delete(`/auth/addresses/${id}`).then((r) => r.data),
};
