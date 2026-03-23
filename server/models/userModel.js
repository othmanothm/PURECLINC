const { getDb } = require('../config/db');

async function findUserByEmail(email) {
  const db = getDb();
  const [rows] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findUserById(id) {
  const db = getDb();
  const [rows] = await db.query('SELECT * FROM Users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createUser({ name, email, passwordHash, role = 'patient' }) {
  const db = getDb();
  const [result] = await db.query(
    'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role]
  );
  return { id: result.insertId, name, email, role };
}

async function updatePassword(userId, passwordHash) {
  const db = getDb();
  await db.query('UPDATE Users SET password = ? WHERE id = ?', [passwordHash, userId]);
  return true;
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updatePassword,
};


