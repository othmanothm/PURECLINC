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

/**
 * @param {{ name: string, email: string, passwordHash: string, role?: string, emailVerified?: boolean }} fields
 * When `emailVerified` is omitted, new accounts are treated as verified (for admin/scripts). Patient signup sets false explicitly.
 */
async function createUser({ name, email, passwordHash, role = 'patient', emailVerified }) {
  const db = getDb();
  const verified =
    emailVerified === undefined ? 1 : emailVerified ? 1 : 0;
  const [result] = await db.query(
    'INSERT INTO Users (name, email, password, role, email_verified) VALUES (?, ?, ?, ?, ?)',
    [name, email, passwordHash, role, verified]
  );
  return { id: result.insertId, name, email, role };
}

/** Expiry uses MySQL NOW() so it matches verification checks regardless of server/Node timezone. */
async function setEmailVerificationChallenge(userId, codeHash) {
  const db = getDb();
  const mins = Number(process.env.EMAIL_VERIFICATION_EXPIRY_MINUTES || 15);
  await db.query(
    `UPDATE Users SET email_verification_code_hash = ?, email_verification_expires_at = DATE_ADD(NOW(), INTERVAL ? MINUTE), email_verification_sent_at = NOW() WHERE id = ?`,
    [codeHash, mins, userId]
  );
}

async function isVerificationChallengeActive(userId) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT 1 AS ok FROM Users WHERE id = ? AND email_verification_expires_at IS NOT NULL AND email_verification_expires_at > NOW() LIMIT 1`,
    [userId]
  );
  return rows.length > 0;
}

async function markEmailVerified(userId) {
  const db = getDb();
  await db.query(
    `UPDATE Users SET email_verified = 1, email_verification_code_hash = NULL, email_verification_expires_at = NULL WHERE id = ?`,
    [userId]
  );
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
  setEmailVerificationChallenge,
  isVerificationChallengeActive,
  markEmailVerified,
  updatePassword,
};


