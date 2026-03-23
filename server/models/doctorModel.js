const { getDb } = require('../config/db');

async function getDoctorByUserId(userId) {
  const db = getDb();
  const [rows] = await db.query(
    'SELECT * FROM Doctors WHERE user_id = ?',
    [userId]
  );
  return rows[0] || null;
}

async function getDoctorById(doctorId) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT d.*, u.name, u.email, u.role 
     FROM Doctors d 
     JOIN Users u ON d.user_id = u.id 
     WHERE d.id = ?`,
    [doctorId]
  );
  return rows[0] || null;
}

async function getAllDoctors() {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT d.*, u.id as user_id, u.name, u.email 
     FROM Doctors d 
     JOIN Users u ON d.user_id = u.id 
     WHERE u.role = 'doctor'
     ORDER BY u.name`
  );
  return rows;
}

async function createDoctor({ userId, specialization }) {
  const db = getDb();
  const [result] = await db.query(
    'INSERT INTO Doctors (user_id, specialization) VALUES (?, ?)',
    [userId, specialization || null]
  );
  return { id: result.insertId, user_id: userId, specialization };
}

async function updateDoctor(doctorId, { specialization }) {
  const db = getDb();
  await db.query('UPDATE Doctors SET specialization = ? WHERE id = ?', [
    specialization || null,
    doctorId,
  ]);
  return getDoctorById(doctorId);
}

module.exports = {
  getDoctorByUserId,
  getDoctorById,
  getAllDoctors,
  createDoctor,
  updateDoctor,
};

