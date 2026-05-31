const { statusBlocksCalendarSlot } = require('../constants/appointmentStatus');
const { normalizeAppointmentTime } = require('./appointmentTime');

/**
 * In-memory check using normalized HH:MM (for lists already loaded from DB).
 */
function isTimeSlotBlockedInList(appointments, appointmentTime) {
  const target = normalizeAppointmentTime(appointmentTime);
  return appointments.some(
    (apt) =>
      normalizeAppointmentTime(apt.appointment_time) === target &&
      statusBlocksCalendarSlot(apt.status)
  );
}

module.exports = {
  isTimeSlotBlockedInList,
  statusBlocksCalendarSlot,
};
