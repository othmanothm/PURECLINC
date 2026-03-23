const { getDb } = require('../config/db');

async function getTreatmentByAppointmentId(appointmentId) {
  const db = getDb();
  const [rows] = await db.query(
    'SELECT * FROM TreatmentSessions WHERE appointment_id = ?',
    [appointmentId]
  );
  return rows[0] || null;
}

async function createTreatment({ appointmentId, sessionPrice, amountPaid, notes }) {
  const db = getDb();
  const [result] = await db.query(
    `INSERT INTO TreatmentSessions (appointment_id, session_price, amount_paid, notes)
     VALUES (?, ?, ?, ?)`,
    [appointmentId, sessionPrice || 0, amountPaid || 0, notes || null]
  );
  return { id: result.insertId, appointment_id: appointmentId, session_price: sessionPrice, amount_paid: amountPaid, notes };
}

async function updateTreatment(treatmentId, { sessionPrice, amountPaid, notes }) {
  const db = getDb();
  const updates = [];
  const params = [];

  if (sessionPrice !== undefined) {
    updates.push('session_price = ?');
    params.push(sessionPrice);
  }
  if (amountPaid !== undefined) {
    updates.push('amount_paid = ?');
    params.push(amountPaid);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    params.push(notes);
  }

  if (updates.length === 0) {
    return getTreatmentById(treatmentId);
  }

  params.push(treatmentId);
  await db.query(`UPDATE TreatmentSessions SET ${updates.join(', ')} WHERE id = ?`, params);
  return getTreatmentById(treatmentId);
}

async function getTreatmentById(treatmentId) {
  const db = getDb();
  const [rows] = await db.query(
    'SELECT * FROM TreatmentSessions WHERE id = ?',
    [treatmentId]
  );
  return rows[0] || null;
}

async function getPatientTreatments(patientId) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT ts.*, a.appointment_date, a.appointment_time, a.status as appointment_status
     FROM TreatmentSessions ts
     JOIN Appointments a ON ts.appointment_id = a.id
     WHERE a.patient_id = ?
     ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
    [patientId]
  );
  return rows;
}

module.exports = {
  getTreatmentByAppointmentId,
  createTreatment,
  updateTreatment,
  getTreatmentById,
  getPatientTreatments,
};

