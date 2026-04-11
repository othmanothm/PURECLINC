/**
 * Appointment lifecycle states (persisted in DB). API bodies use these exact strings — not verbs.
 * UI "Confirm" / "Cancel" map to CONFIRMED / CANCELLED here.
 */
const APPOINTMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

const ALL_STATUSES = Object.freeze(Object.values(APPOINTMENT_STATUS));

const TERMINAL_STATUSES = Object.freeze(
  new Set([APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.CANCELLED])
);

/**
 * Strict state machine: keys are current status, values are allowed next statuses.
 * Transition to COMPLETED is additionally gated in the controller: at least one TreatmentSession
 * for the appointment must record price, payment, or substantive notes (not view-only).
 */
const ALLOWED_TRANSITIONS = Object.freeze({
  [APPOINTMENT_STATUS.PENDING]: [
    APPOINTMENT_STATUS.CONFIRMED,
    APPOINTMENT_STATUS.CANCELLED,
  ],
  [APPOINTMENT_STATUS.CONFIRMED]: [
    APPOINTMENT_STATUS.COMPLETED,
    APPOINTMENT_STATUS.CANCELLED,
  ],
  [APPOINTMENT_STATUS.COMPLETED]: [],
  [APPOINTMENT_STATUS.CANCELLED]: [],
});

function isValidAppointmentStatus(value) {
  return typeof value === 'string' && ALL_STATUSES.includes(value);
}

/**
 * @param {string} fromStatus - current row value
 * @param {string} toStatus - requested next value (must differ; same-state short-circuit in controller)
 */
function canTransitionTo(fromStatus, toStatus) {
  if (fromStatus === toStatus) return false;
  const allowed = ALLOWED_TRANSITIONS[fromStatus];
  if (!allowed) return false;
  return allowed.includes(toStatus);
}

/** Slots stay blocked for any booking except cancelled (pending, confirmed, completed all hold the time). */
function statusBlocksCalendarSlot(status) {
  return status !== APPOINTMENT_STATUS.CANCELLED;
}

module.exports = {
  APPOINTMENT_STATUS,
  ALL_STATUSES,
  TERMINAL_STATUSES,
  ALLOWED_TRANSITIONS,
  isValidAppointmentStatus,
  canTransitionTo,
  statusBlocksCalendarSlot,
};
