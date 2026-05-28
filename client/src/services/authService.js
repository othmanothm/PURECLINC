import api from './api';

export const authService = {
  async register(name, email, password) {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
    });
    return response.data;
  },

  async verifyEmail(email, code) {
    const response = await api.post('/auth/verify-email', { email, code });
    return response.data;
  },

  async resendVerification(email) {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },

  async login(email, password) {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    const data = response.data;
    if (!response.status || response.status < 200 || response.status >= 300) {
      const err = new Error(data?.message || 'Login failed');
      err.response = response;
      throw err;
    }
    if (!data?.token || !data?.user) {
      const err = new Error(data?.message || 'Invalid login response');
      err.response = { status: response.status, data };
      throw err;
    }
    return data;
  },

  async adminLogin(email, password) {
    const response = await api.post('/auth/admin-login', {
      email,
      password,
    });
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async changePassword(currentPassword, newPassword) {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

