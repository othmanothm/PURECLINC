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

/** Statuses that block a doctor/date/time slot (cancelled does not block). */
const BLOCKING_SLOT_STATUSES = Object.freeze([
  APPOINTMENT_STATUS.PENDING,
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.COMPLETED,
]);

/** Slots stay blocked for pending, confirmed, or completed. */
function statusBlocksCalendarSlot(status) {
  const normalized =
    typeof status === 'string' ? status.trim().toLowerCase() : status;
  return BLOCKING_SLOT_STATUSES.includes(normalized);
}

module.exports = {
  APPOINTMENT_STATUS,
  ALL_STATUSES,
  TERMINAL_STATUSES,
  ALLOWED_TRANSITIONS,
  BLOCKING_SLOT_STATUSES,
  isValidAppointmentStatus,
  canTransitionTo,
  statusBlocksCalendarSlot,
};
