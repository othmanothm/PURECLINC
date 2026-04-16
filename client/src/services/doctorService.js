import api from './api';

export const doctorService = {
  async getMyProfile() {
    const response = await api.get('/doctor/me');
    return response.data;
  },

  async getMyAppointments() {
    const response = await api.get('/doctor/appointments');
    return response.data;
  },

  async getPatients() {
    const response = await api.get('/doctor/patients');
    return response.data;
  },

  async getPatientRecord(patientId) {
    const response = await api.get(`/doctor/patients/${patientId}`);
    return response.data;
  },

  async updatePatientNotes(patientId, notes) {
    const response = await api.put(`/doctor/patients/${patientId}/notes`, { notes });
    return response.data;
  },

  async updatePatientMedicalRecord(patientId, data) {
    const response = await api.put(`/doctor/patients/${patientId}/medical-record`, data);
    return response.data;
  },

  async createOrUpdateTreatment(appointmentId, treatmentData) {
    const response = await api.post(`/doctor/appointments/${appointmentId}/treatment`, treatmentData);
    return response.data;
  },
};

