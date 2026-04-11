import api from './api';

export const orderService = {
  async createCheckoutSession(items, checkoutData = {}) {
    const response = await api.post('/orders/create-checkout-session', {
      items,
      ...checkoutData,
    });
    return response.data;
  },

  /** Server-only pricing preview (read-only). */
  async previewCheckout(items) {
    const response = await api.post('/orders/checkout-preview', { items });
    return response.data;
  },

  async getMyOrders() {
    const response = await api.get('/orders/my');
    return response.data;
  },

  /** Poll after Stripe redirect until webhook confirms payment. */
  async getOrderByCheckoutSession(sessionId) {
    const response = await api.get(`/orders/by-session/${encodeURIComponent(sessionId)}`);
    return response.data;
  },
};
