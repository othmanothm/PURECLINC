import api from './api';

export const patientService = {
  async getMyProfile() {
    const response = await api.get('/patients/me');
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.put('/patients/me/profile', data);
    return response.data;
  },

  async updateMedicalRecord(data) {
    const response = await api.put('/patients/me/medical-record', data);
    return response.data;
  },
};

