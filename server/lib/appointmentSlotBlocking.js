/** @deprecated Import from appointmentSlotService — kept for backward compatibility. */
const {
  BLOCKING_SLOT_STATUSES,
  parseDoctorId,
  normalizeBookingFields,
  logAppointmentBook,
} = require('./appointmentSlotService');
const { normalizeAppointmentDate, normalizeAppointmentTime } = require('./appointmentTime');

function normalizeSlotRequest({ doctorId, appointmentDate, appointmentTime }) {
  return normalizeBookingFields({ doctorId, appointmentDate, appointmentTime });
}

function statusBlocksCalendarSlot(status) {
  return BLOCKING_SLOT_STATUSES.includes(
    typeof status === 'string' ? status.trim().toLowerCase() : status
  );
}

function logAppointmentBooking(event, data) {
  logAppointmentBook(event, data);
}

module.exports = {
  BLOCKING_SLOT_STATUSES,
  parseDoctorId,
  normalizeSlotRequest,
  normalizeBookingFields,
  statusBlocksCalendarSlot,
  logAppointmentBooking,
  logAppointmentBook,
};
