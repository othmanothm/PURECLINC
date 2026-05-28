import api from './api';

export const productService = {
  async getProducts(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);
    if (params.minPrice !== undefined && params.minPrice !== null && params.minPrice !== '') {
      queryParams.append('minPrice', params.minPrice);
    }
    if (params.maxPrice !== undefined && params.maxPrice !== null && params.maxPrice !== '') {
      queryParams.append('maxPrice', params.maxPrice);
    }
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);

    const response = await api.get(`/products?${queryParams.toString()}`);
    return response.data;
  },

  async getProduct(id) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
};