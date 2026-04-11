const { getDb } = require('../config/db');

async function createReview({ patientId, appointmentId, rating, comment }) {
  const db = getDb();
  const [result] = await db.query(
    `INSERT INTO Reviews (patient_id, appointment_id, rating, comment, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [patientId, appointmentId, rating, comment]
  );
  return {
    id: result.insertId,
    patient_id: patientId,
    appointment_id: appointmentId,
    status: 'pending',
  };
}

async function getApprovedReviews({ limit = 50, offset = 0 } = {}) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT
      r.id,
      r.rating,
      r.comment,
      r.created_at,
      u.name AS patient_name
     FROM Reviews r
     JOIN Patients p ON r.patient_id = p.id
     JOIN Users u ON p.user_id = u.id
     WHERE r.status = 'approved'
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [Number(limit), Number(offset)]
  );
  return rows;
}

async function getReviewByAppointmentId(appointmentId) {
  const db = getDb();
  const [rows] = await db.query('SELECT * FROM Reviews WHERE appointment_id = ?', [
    appointmentId,
  ]);
  return rows[0] || null;
}

async function getReviewById(id) {
  const db = getDb();
  const [rows] = await db.query('SELECT * FROM Reviews WHERE id = ?', [id]);
  return rows[0] || null;
}

async function updateReviewStatus(id, status) {
  const db = getDb();
  await db.query('UPDATE Reviews SET status = ? WHERE id = ?', [status, id]);
  return getReviewById(id);
}

async function getReviewsByPatientUserId(userId, { status: statusFilter } = {}) {
  const db = getDb();
  const params = [userId];
  let sql = `SELECT r.id, r.appointment_id, r.rating, r.comment, r.status, r.created_at
     FROM Reviews r
     INNER JOIN Patients p ON r.patient_id = p.id
     WHERE p.user_id = ?`;
  if (statusFilter && statusFilter !== 'all') {
    sql += ' AND r.status = ?';
    params.push(statusFilter);
  }
  sql += ' ORDER BY r.created_at DESC';
  const [rows] = await db.query(sql, params);
  return rows;
}

async function deleteReviewById(reviewId) {
  const db = getDb();
  const [result] = await db.query('DELETE FROM Reviews WHERE id = ?', [reviewId]);
  return result.affectedRows > 0;
}

module.exports = {
  createReview,
  getApprovedReviews,
  getReviewByAppointmentId,
  getReviewById,
  updateReviewStatus,
  getReviewsByPatientUserId,
  deleteReviewById,
};

