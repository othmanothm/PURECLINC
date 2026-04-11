import api from './api';

export const reviewService = {
  async createReview({ appointmentId, rating, comment }) {
    const response = await api.post('/reviews', { appointmentId, rating, comment });
    return response.data;
  },

  async getReviews({ limit = 50, offset = 0 } = {}) {
    const response = await api.get(`/reviews?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  async getApprovedReviews({ limit = 50, offset = 0 } = {}) {
    const response = await api.get(`/reviews?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  async updateReviewStatus(reviewId, status) {
    const response = await api.patch(`/reviews/${reviewId}/status`, { status });
    return response.data;
  },
};

