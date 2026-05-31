const { getDb } = require('../config/db');
const { APPOINTMENT_STATUS } = require('../constants/appointmentStatus');
const { treatmentSessionEvidencePredicate } = require('./treatmentModel');
const { toMysqlTime } = require('../lib/appointmentTime');
const {
  findBlockingAppointment,
  getBlockingSlotTimes,
  parseDoctorId,
  normalizeBookingFields,
} = require('../lib/appointmentSlotService');

async function findBlockingAppointmentByDoctorDateTime(
  doctorId,
  appointmentDate,
  appointmentTime,
  connection = null
) {
  const db = connection || getDb();
  const { blocking } = await findBlockingAppointment(db, {
    doctorId,
    appointmentDate,
    appointmentTime,
  });
  return blocking;
}

async function getBlockingSlotTimesForDoctorDate(doctorId, date) {
  const pool = getDb();
  return getBlockingSlotTimes(pool, doctorId, date);
}

/**
 * Insert with transaction + blocking check + FOR UPDATE (race safety).
 */
async function createAppointmentWithSlotGuard({
  patientId,
  doctorId,
  appointmentDate,
  appointmentTime,
  treatmentCategory = null,
  status = APPOINTMENT_STATUS.PENDING,
}) {
  const pool = getDb();
  const conn = await pool.getConnection();
  const { doctorId: doctorIdNum, dateStr, timeStr } = normalizeBookingFields({
    doctorId,
    appointmentDate,
    appointmentTime,
  });

  if (!doctorIdNum || !dateStr || !timeStr) {
    const err = new Error('Invalid doctor, date, or time');
    err.status = 400;
    throw err;
  }

  const mysqlTime = toMysqlTime(timeStr);

  try {
    await conn.beginTransaction();

    const { blocking } = await findBlockingAppointment(conn, {
      doctorId: doctorIdNum,
      appointmentDate: dateStr,
      appointmentTime: timeStr,
    });

    if (blocking) {
      const err = new Error('Time slot is already booked');
      err.status = 409;
      throw err;
    }

    await conn.query(
      `SELECT id FROM Appointments
       WHERE doctor_id = ?
         AND DATE(appointment_date) = ?
         AND TIME_FORMAT(appointment_time, '%H:%i') = ?
         AND LOWER(TRIM(status)) IN ('pending', 'confirmed', 'completed')
       FOR UPDATE`,
      [doctorIdNum, dateStr, timeStr]
    );

    const [result] = await conn.query(
      `INSERT INTO Appointments (patient_id, doctor_id, appointment_date, appointment_time, treatment_category, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [patientId, doctorIdNum, dateStr, mysqlTime, treatmentCategory, status]
    );

    await conn.commit();
    return { id: result.insertId, patient_id: patientId, doctor_id: doctorIdNum };
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      const dup = new Error('Time slot is already booked');
      dup.status = 409;
      throw dup;
    }
    throw err;
  } finally {
    conn.release();
  }
}

async function createAppointment(params) {
  return createAppointmentWithSlotGuard(params);
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
  const pool = getDb();
  const doctorIdNum = parseDoctorId(doctorId);
  const { normalizeAppointmentDate } = require('../lib/appointmentTime');
  const dateStr = normalizeAppointmentDate(date);
  const [rows] = await pool.query(
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
  createAppointmentWithSlotGuard,
  findBlockingAppointmentByDoctorDateTime,
  getBlockingSlotTimesForDoctorDate,
  getAppointmentById,
  getPatientAppointments,
  getDoctorAppointments,
  getDoctorAppointmentsWithCompletionHints,
  getAppointmentsByDateAndDoctor,
  updateAppointmentStatus,
  listAppointmentIdsNeedingReminder,
  markAppointmentReminderSent,
};
