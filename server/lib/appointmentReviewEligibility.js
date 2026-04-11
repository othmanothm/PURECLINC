const { APPOINTMENT_STATUS } = require('../constants/appointmentStatus');

/**
 * Patient-authored reviews: only after the visit is marked completed.
 * Reviews are keyed by appointment_id (unique) — see Reviews table.
 */
function assertPatientCanReviewAppointment(appointment, patientRowId) {
  if (!appointment) {
    return { ok: false, status: 404, message: 'Appointment not found' };
  }
  if (Number(appointment.patient_id) !== Number(patientRowId)) {
    return { ok: false, status: 403, message: 'You can only review your own appointments' };
  }
  if (appointment.status !== APPOINTMENT_STATUS.COMPLETED) {
    return {
      ok: false,
      status: 400,
      message: 'You can only review completed appointments',
    };
  }
  return { ok: true };
}

module.exports = { assertPatientCanReviewAppointment };
