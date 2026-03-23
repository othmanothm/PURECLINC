import api from './api';

export const appointmentService = {
  async getDoctors() {
    const response = await api.get('/appointments/doctors');
    return response.data;
  },

  async getAvailableSlots(doctorId, date) {
    const response = await api.get(`/appointments/slots?doctorId=${doctorId}&date=${date}`);
    return response.data;
  },

  async bookAppointment(data) {
    const response = await api.post('/appointments', data);
    return response.data;
  },

  async getMyAppointments() {
    const response = await api.get('/appointments/my');
    return response.data;
  },

  async updateAppointmentStatus(appointmentId, status) {
    const response = await api.put(`/appointments/${appointmentId}/status`, { status });
    return response.data;
  },
};

