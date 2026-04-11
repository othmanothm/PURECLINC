const { getDb } = require('../config/db');

/**
 * SQL predicate: session qualifies as documented treatment for appointment completion.
 * Keep in sync with appointment completion gate / doctor list EXISTS subquery.
 * @param {string} alias - table alias (e.g. 'ts')
 */
function treatmentSessionEvidencePredicate(alias = 'ts') {
  return `(${alias}.session_price > 0 OR ${alias}.amount_paid > 0 OR CHAR_LENGTH(TRIM(COALESCE(${alias}.notes, ''))) >= 3)`;
}

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

async function appointmentHasTreatmentEvidenceForCompletion(appointmentId) {
  const db = getDb();
  const ev = treatmentSessionEvidencePredicate('ts');
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS cnt FROM TreatmentSessions ts
     WHERE ts.appointment_id = ? AND ${ev}`,
    [appointmentId]
  );
  return Number(row.cnt) > 0;
}

async function getPatientTreatments(patientId) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT ts.*, a.appointment_date, a.appointment_time, a.status as appointment_status,
            u.name AS doctor_name
     FROM TreatmentSessions ts
     JOIN Appointments a ON ts.appointment_id = a.id
     JOIN Doctors d ON a.doctor_id = d.id
     JOIN Users u ON d.user_id = u.id
     WHERE a.patient_id = ?
     ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
    [patientId]
  );
  return rows;
}

module.exports = {
  treatmentSessionEvidencePredicate,
  getTreatmentByAppointmentId,
  createTreatment,
  updateTreatment,
  getTreatmentById,
  getPatientTreatments,
  appointmentHasTreatmentEvidenceForCompletion,
};
