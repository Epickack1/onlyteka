import $api from './index';

export const usersApi = {
  getAll: () => $api.get('/users'),
  getById: (id) => $api.get(`/users/${id}`),
  update: (id, data) => $api.put(`/users/${id}`, data),
  block: (id) => $api.delete(`/users/${id}`),
  unblock: (id) => $api.post(`/users/${id}/unblock`),
};