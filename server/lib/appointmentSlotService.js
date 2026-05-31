/**
 * Single source of truth for doctor/date/time slot blocking (POST book + GET slots).
 */
const { normalizeAppointmentDate, normalizeAppointmentTime } = require('./appointmentTime');

const BLOCKING_SLOT_STATUSES = ['pending', 'confirmed', 'completed'];

const BLOCKING_APPOINTMENT_SQL = `
  SELECT id, status, doctor_id, appointment_date, appointment_time
  FROM Appointments
  WHERE doctor_id = ?
    AND DATE(appointment_date) = ?
    AND TIME_FORMAT(appointment_time, '%H:%i') = ?
    AND LOWER(TRIM(status)) IN ('pending', 'confirmed', 'completed')
  LIMIT 1
`;

const BLOCKING_SLOT_TIMES_SQL = `
  SELECT TIME_FORMAT(appointment_time, '%H:%i') AS slot_time
  FROM Appointments
  WHERE doctor_id = ?
    AND DATE(appointment_date) = ?
    AND LOWER(TRIM(status)) IN ('pending', 'confirmed', 'completed')
  ORDER BY slot_time
`;

function parseDoctorId(doctorId) {
  const n = parseInt(doctorId, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

function normalizeBookingFields({ doctorId, appointmentDate, appointmentTime }) {
  return {
    doctorId: parseDoctorId(doctorId),
    dateStr: normalizeAppointmentDate(appointmentDate),
    timeStr: normalizeAppointmentTime(appointmentTime),
  };
}

/**
 * @param {import('mysql2/promise').Pool | import('mysql2/promise').PoolConnection} db
 */
async function findBlockingAppointment(db, { doctorId, appointmentDate, appointmentTime }) {
  const { doctorId: doctorIdNum, dateStr, timeStr } = normalizeBookingFields({
    doctorId,
    appointmentDate,
    appointmentTime,
  });
  if (!doctorIdNum || !dateStr || !timeStr) {
    return { blocking: null, doctorIdNum, dateStr, timeStr };
  }

  const [rows] = await db.query(BLOCKING_APPOINTMENT_SQL, [doctorIdNum, dateStr, timeStr]);
  return {
    blocking: rows[0] || null,
    doctorIdNum,
    dateStr,
    timeStr,
  };
}

/**
 * @param {import('mysql2/promise').Pool} pool
 */
async function getBlockingSlotTimes(pool, doctorId, appointmentDate) {
  const doctorIdNum = parseDoctorId(doctorId);
  const dateStr = normalizeAppointmentDate(appointmentDate);
  if (!doctorIdNum || !dateStr) return [];

  const [rows] = await pool.query(BLOCKING_SLOT_TIMES_SQL, [doctorIdNum, dateStr]);
  return rows.map((r) => r.slot_time);
}

function logAppointmentBook(step, data) {
  console.log(
    JSON.stringify({
      tag: 'appointment-book',
      step,
      blockingStatuses: BLOCKING_SLOT_STATUSES,
      ...data,
      ts: new Date().toISOString(),
    })
  );
}

module.exports = {
  BLOCKING_SLOT_STATUSES,
  BLOCKING_APPOINTMENT_SQL,
  BLOCKING_SLOT_TIMES_SQL,
  parseDoctorId,
  normalizeBookingFields,
  findBlockingAppointment,
  getBlockingSlotTimes,
  logAppointmentBook,
};
