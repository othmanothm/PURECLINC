const { getDb } = require('../config/db');

async function getPatientByUserId(userId) {
  const db = getDb();
  const [rows] = await db.query(
    'SELECT * FROM Patients WHERE user_id = ?',
    [userId]
  );
  return rows[0] || null;
}

async function getPatientById(patientId) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT p.*, u.name, u.email, u.role 
     FROM Patients p 
     JOIN Users u ON p.user_id = u.id 
     WHERE p.id = ?`,
    [patientId]
  );
  return rows[0] || null;
}

async function createPatientProfile({ userId }) {
  const db = getDb();
  const [result] = await db.query(
    'INSERT INTO Patients (user_id, phone, date_of_birth, address, general_health) VALUES (?, NULL, NULL, NULL, NULL)',
    [userId]
  );
  return { id: result.insertId, user_id: userId };
}

async function updatePatientProfile(userId, data) {
  const db = getDb();
  const { phone, dateOfBirth, address, generalHealth } = data;

  await db.query(
    `UPDATE Patients SET
    phone = ?,
    date_of_birth = ?,
    address = ?,
    general_health = ?
    WHERE user_id = ?`,
    [
      phone || null,
      dateOfBirth || null,
      address || null,
      generalHealth || null,
      userId,
    ]
  );

  return getPatientByUserId(userId);
}

async function patchPatientGeneralHealth(patientId, generalHealth) {
  if (generalHealth === undefined) return;
  const db = getDb();
  await db.query(`UPDATE Patients SET general_health = ? WHERE id = ?`, [
    generalHealth === '' ? null : generalHealth,
    patientId,
  ]);
}

module.exports = {
  getPatientByUserId,
  getPatientById,
  createPatientProfile,
  updatePatientProfile,
  patchPatientGeneralHealth,
};


