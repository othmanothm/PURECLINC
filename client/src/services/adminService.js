import api from './api';

export const adminService = {
  async getStats() {
    const response = await api.get('/admin/stats/overview');
    return response.data;
  },

  async getStoreSummary() {
    const response = await api.get('/admin/store/summary');
    return response.data;
  },

  async getUsers(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);
    const response = await api.get(`/admin/users?${queryParams.toString()}`);
    return response.data;
  },

  async updateUser(id, data) {
    const response = await api.patch(`/admin/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id) {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  async getPatientReviews(userId, { status } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'all') {
      params.set('status', status);
    }
    const qs = params.toString();
    const response = await api.get(
      `/admin/users/${userId}/reviews${qs ? `?${qs}` : ''}`
    );
    return response.data;
  },

  async deleteReview(reviewId) {
    const response = await api.delete(`/admin/reviews/${reviewId}`);
    return response.data;
  },

  async getDoctors() {
    const response = await api.get('/admin/doctors');
    return response.data;
  },

  async createDoctor(data) {
    const response = await api.post('/admin/doctors', data);
    return response.data;
  },

  async updateDoctor(id, data) {
    const response = await api.put(`/admin/doctors/${id}`, data);
    return response.data;
  },

  async deleteDoctor(id) {
    const response = await api.delete(`/admin/doctors/${id}`);
    return response.data;
  },

  async getProducts(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);
    const response = await api.get(`/admin/products?${queryParams.toString()}`);
    return response.data;
  },

  async createProduct(data) {
    const response = await api.post('/admin/products', data);
    return response.data;
  },

  async updateProduct(id, data) {
    const response = await api.put(`/admin/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id) {
    const response = await api.delete(`/admin/products/${id}`);
    return response.data;
  },

  async getOrders(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
    if (params.search) queryParams.append('search', params.search);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);
    const response = await api.get(`/admin/orders?${queryParams.toString()}`);
    return response.data;
  },

  async getOrderById(orderId) {
    const response = await api.get(`/admin/orders/${orderId}`);
    return response.data;
  },

  async updateOrderStatus(orderId, status) {
    const response = await api.patch(`/admin/orders/${orderId}/status`, { status });
    return response.data;
  },

  async updateOrderNotes(orderId, adminNotes) {
    const response = await api.patch(`/admin/orders/${orderId}/notes`, { adminNotes });
    return response.data;
  },

  async updateOrderPaymentStatus(orderId, paymentStatus) {
    const response = await api.patch(`/admin/orders/${orderId}/payment-status`, { paymentStatus });
    return response.data;
  },

  async adjustProductStock(productId, { delta, reason }) {
    const response = await api.post(`/admin/products/${productId}/stock-adjustment`, {
      delta,
      reason,
    });
    return response.data;
  },

  async getPatientFinancialHistory(userId) {
    const response = await api.get(`/admin/patients/${userId}/financial-history`);
    return response.data;
  },

  async getPatientUserOptions() {
    const response = await api.get('/admin/patient-user-options');
    return response.data;
  },
};

