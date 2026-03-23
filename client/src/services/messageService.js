import api from './api';

export const messageService = {
  async getConversations() {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  async getConversationWithUser(userId) {
    const response = await api.get(`/messages/with/${userId}`);
    return response.data;
  },

  async sendMessage(receiverId, message) {
    const response = await api.post('/messages', { receiverId, message });
    return response.data;
  },
};

