const { getDb } = require('../config/db');
const { APPOINTMENT_STATUS, BLOCKING_SLOT_STATUSES } = require('../constants/appointmentStatus');
const { treatmentSessionEvidencePredicate } = require('./treatmentModel');

function parseDoctorId(doctorId) {
  const n = parseInt(doctorId, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** "14:00:00" -> "14:00", "14:00" -> "14:00" */
function normalizeAppointmentTime(value) {
  if (value == null) return '';
  if (value instanceof Date) {
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  }
  const raw = String(value).trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return raw;
  return `${String(parseInt(match[1], 10)).padStart(2, '0')}:${match[2]}`;
}

/** Returns YYYY-MM-DD without timezone day shift (ISO date-only uses UTC calendar parts). */
function normalizeAppointmentDate(value) {
  if (value == null) return '';
  if (typeof value === 'string') {
    const m = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear();
    const mo = String(value.getUTCMonth() + 1).padStart(2, '0');
    const d = String(value.getUTCDate()).padStart(2, '0');
    return `${y}-${mo}-${d}`;
  }
  const asString = String(value).trim();
  const embedded = asString.match(/^(\d{4}-\d{2}-\d{2})/);
  if (embedded) return embedded[1];
  return asString.slice(0, 10);
}

function createSlotConflictError() {
  const err = new Error('Time slot is already booked');
  err.status = 409;
  return err;
}

function slotLockName(doctorIdNum, dateStr, timeStr) {
  return `apt_slot_${doctorIdNum}_${dateStr}_${timeStr}`;
}

async function findBlockingAppointment(doctorId, appointmentDate, appointmentTime, connection = null) {
  const db = connection || getDb();
  const doctorIdNum = parseDoctorId(doctorId);
  if (!doctorIdNum) return null;

  const dateStr = normalizeAppointmentDate(appointmentDate);
  const timeStr = normalizeAppointmentTime(appointmentTime);

  const [rows] = await db.query(
    `SELECT id, status, doctor_id, appointment_date, appointment_time
     FROM Appointments
     WHERE doctor_id = ?
       AND DATE(appointment_date) = ?
       AND TIME_FORMAT(appointment_time, '%H:%i') = ?
       AND LOWER(TRIM(status)) IN (?, ?, ?)
     LIMIT 1`,
    [doctorIdNum, dateStr, timeStr, ...BLOCKING_SLOT_STATUSES]
  );
  return rows[0] || null;
}

/** @deprecated use findBlockingAppointment */
const findActiveAppointmentByDoctorSlot = findBlockingAppointment;

async function getBlockedSlotTimesForDoctorDate(doctorId, appointmentDate) {
  const db = getDb();
  const doctorIdNum = parseDoctorId(doctorId);
  if (!doctorIdNum) return [];

  const dateStr = normalizeAppointmentDate(appointmentDate);
  const [rows] = await db.query(
    `SELECT TIME_FORMAT(appointment_time, '%H:%i') AS slot_time
     FROM Appointments
     WHERE doctor_id = ?
       AND DATE(appointment_date) = ?
       AND LOWER(TRIM(status)) IN (?, ?, ?)
     ORDER BY slot_time`,
    [doctorIdNum, dateStr, ...BLOCKING_SLOT_STATUSES]
  );
  return rows.map((r) => r.slot_time);
}

async function createAppointment({
  patientId,
  doctorId,
  appointmentDate,
  appointmentTime,
  treatmentCategory = null,
  status = APPOINTMENT_STATUS.PENDING,
}) {
  const doctorIdNum = parseDoctorId(doctorId);
  if (!doctorIdNum) {
    throw createSlotConflictError();
  }

  const dateStr = normalizeAppointmentDate(appointmentDate);
  const timeStr = normalizeAppointmentTime(appointmentTime);
  const mysqlTime = `${timeStr}:00`;

  const pool = getDb();
  const connection = await pool.getConnection();
  const lockName = slotLockName(doctorIdNum, dateStr, timeStr);

  try {
    const [lockRows] = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [lockName]);
    if (!lockRows[0]?.acquired) {
      throw createSlotConflictError();
    }

    const blockingAppointment = await findBlockingAppointment(
      doctorIdNum,
      dateStr,
      timeStr,
      connection
    );
    if (blockingAppointment) {
      throw createSlotConflictError();
    }

    const [result] = await connection.query(
      `INSERT INTO Appointments (patient_id, doctor_id, appointment_date, appointment_time, treatment_category, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [patientId, doctorIdNum, dateStr, mysqlTime, treatmentCategory, status]
    );

    return { id: result.insertId, patient_id: patientId, doctor_id: doctorIdNum };
  } finally {
    try {
      await connection.query('SELECT RELEASE_LOCK(?)', [lockName]);
    } catch (_releaseErr) {
      // lock may already be released on connection return
    }
    connection.release();
  }
}

/** Read-only: groups of duplicate active slots (manual cleanup required). */
async function findDuplicateActiveAppointmentSlots() {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT doctor_id,
            DATE(appointment_date) AS appointment_date,
            TIME_FORMAT(appointment_time, '%H:%i') AS appointment_time,
            COUNT(*) AS count,
            GROUP_CONCAT(CONCAT(id, ':', status) ORDER BY id) AS appointments
     FROM Appointments
     WHERE LOWER(TRIM(status)) IN (?, ?, ?)
     GROUP BY doctor_id, DATE(appointment_date), TIME_FORMAT(appointment_time, '%H:%i')
     HAVING COUNT(*) > 1
     ORDER BY appointment_date, appointment_time, doctor_id`,
    [...BLOCKING_SLOT_STATUSES]
  );
  return rows;
}

async function getAppointmentById(appointmentId) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT a.*, 
     p.user_id as patient_user_id,
     u_p.name as patient_name,
     u_p.email as patient_email,
     u_d.name as doctor_name,
     d.specialization
     FROM Appointments a
     JOIN Patients p ON a.patient_id = p.id
     JOIN Users u_p ON p.user_id = u_p.id
     JOIN Doctors d ON a.doctor_id = d.id
     JOIN Users u_d ON d.user_id = u_d.id
     WHERE a.id = ?`,
    [appointmentId]
  );
  return rows[0] || null;
}

async function getPatientAppointments(patientId) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT a.*, 
     u_d.name as doctor_name,
     d.specialization
     FROM Appointments a
     JOIN Doctors d ON a.doctor_id = d.id
     JOIN Users u_d ON d.user_id = u_d.id
     WHERE a.patient_id = ?
     ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
    [patientId]
  );
  return rows;
}

async function getDoctorAppointments(doctorId) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT a.*, 
     u_p.name as patient_name,
     p.phone as patient_phone
     FROM Appointments a
     JOIN Patients p ON a.patient_id = p.id
     JOIN Users u_p ON p.user_id = u_p.id
     WHERE a.doctor_id = ?
     ORDER BY a.appointment_date ASC, a.appointment_time ASC`,
    [doctorId]
  );
  return rows;
}

/**
 * Same as getDoctorAppointments plus hasTreatmentEvidenceForCompletion (for doctor workflow UI).
 */
async function getDoctorAppointmentsWithCompletionHints(doctorId) {
  const db = getDb();
  const ev = treatmentSessionEvidencePredicate('ts');
  const [rows] = await db.query(
    `SELECT a.*,
      u_p.name as patient_name,
      p.phone as patient_phone,
      EXISTS (
        SELECT 1 FROM TreatmentSessions ts
        WHERE ts.appointment_id = a.id AND ${ev}
      ) AS has_treatment_evidence_for_completion
     FROM Appointments a
     JOIN Patients p ON a.patient_id = p.id
     JOIN Users u_p ON p.user_id = u_p.id
     WHERE a.doctor_id = ?
     ORDER BY a.appointment_date ASC, a.appointment_time ASC`,
    [doctorId]
  );
  return rows.map((row) => {
    const { has_treatment_evidence_for_completion, ...rest } = row;
    return {
      ...rest,
      hasTreatmentEvidenceForCompletion: Boolean(has_treatment_evidence_for_completion),
    };
  });
}

async function getAppointmentsByDateAndDoctor(doctorId, date) {
  const db = getDb();
  const doctorIdNum = parseDoctorId(doctorId);
  const dateStr = normalizeAppointmentDate(date);
  const [rows] = await db.query(
    `SELECT appointment_time, status
     FROM Appointments
     WHERE doctor_id = ? AND DATE(appointment_date) = ?
     ORDER BY appointment_time`,
    [doctorIdNum, dateStr]
  );
  return rows;
}

async function updateAppointmentStatus(appointmentId, status) {
  const db = getDb();
  await db.query('UPDATE Appointments SET status = ? WHERE id = ?', [
    status,
    appointmentId,
  ]);
  return getAppointmentById(appointmentId);
}

/** IDs of confirmed appointments needing a reminder (see env APPOINTMENT_REMINDER_*). */
async function listAppointmentIdsNeedingReminder() {
  const db = getDb();
  const hours = Number(process.env.APPOINTMENT_REMINDER_HOURS_BEFORE || 24);
  const windowMin = Number(process.env.APPOINTMENT_REMINDER_WINDOW_MINUTES || 30);
  const centerMin = hours * 60;
  const [rows] = await db.query(
    `SELECT a.id FROM Appointments a
     WHERE a.status = 'confirmed'
     AND a.reminder_email_sent_at IS NULL
     AND TIMESTAMP(a.appointment_date, a.appointment_time) > NOW()
     AND TIMESTAMPDIFF(MINUTE, NOW(), TIMESTAMP(a.appointment_date, a.appointment_time)) BETWEEN ? AND ?`,
    [centerMin - windowMin, centerMin + windowMin]
  );
  return rows.map((r) => r.id);
}

async function markAppointmentReminderSent(appointmentId) {
  const db = getDb();
  await db.query(
    `UPDATE Appointments SET reminder_email_sent_at = NOW() WHERE id = ? AND reminder_email_sent_at IS NULL`,
    [appointmentId]
  );
}

module.exports = {
  createAppointment,
  findBlockingAppointment,
  findActiveAppointmentByDoctorSlot,
  findDuplicateActiveAppointmentSlots,
  getBlockedSlotTimesForDoctorDate,
  normalizeAppointmentDate,
  normalizeAppointmentTime,
  createSlotConflictError,
  getAppointmentById,
  getPatientAppointments,
  getDoctorAppointments,
  getDoctorAppointmentsWithCompletionHints,
  getAppointmentsByDateAndDoctor,
  updateAppointmentStatus,
  listAppointmentIdsNeedingReminder,
  markAppointmentReminderSent,
};

