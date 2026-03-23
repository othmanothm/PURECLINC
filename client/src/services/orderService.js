import api from './api';

export const orderService = {
  async createCheckoutSession(items, checkoutData = {}) {
    const response = await api.post('/orders/create-checkout-session', { 
      items,
      ...checkoutData
    });
    return response.data;
  },

  async createOrder(items, totalPrice) {
    // Prepare items with prices
    const itemsWithPrices = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    const response = await api.post('/orders', {
      items: itemsWithPrices,
      totalPrice,
    });
    return response.data;
  },

  async getMyOrders() {
    const response = await api.get('/orders/my');
    return response.data;
  },
};

