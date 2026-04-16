/**
 * Email verification for patient self-registration (OTP + verified flag).
 */

const name = '017_users_email_verification';

async function up(pool) {
  const [verifiedCol] = await pool.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'email_verified'
  `);
  if (verifiedCol.length === 0) {
    await pool.query(`
      ALTER TABLE Users
      ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 1
      AFTER password
    `);
  }

  const [hashCol] = await pool.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'email_verification_code_hash'
  `);
  if (hashCol.length === 0) {
    await pool.query(`
      ALTER TABLE Users
      ADD COLUMN email_verification_code_hash VARCHAR(64) NULL DEFAULT NULL
      AFTER email_verified
    `);
  }

  const [expCol] = await pool.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'email_verification_expires_at'
  `);
  if (expCol.length === 0) {
    await pool.query(`
      ALTER TABLE Users
      ADD COLUMN email_verification_expires_at DATETIME NULL DEFAULT NULL
      AFTER email_verification_code_hash
    `);
  }

  const [sentCol] = await pool.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'email_verification_sent_at'
  `);
  if (sentCol.length === 0) {
    await pool.query(`
      ALTER TABLE Users
      ADD COLUMN email_verification_sent_at DATETIME NULL DEFAULT NULL
      AFTER email_verification_expires_at
    `);
  }
}

async function down(pool) {
  await pool.query(`ALTER TABLE Users DROP COLUMN email_verification_sent_at`);
  await pool.query(`ALTER TABLE Users DROP COLUMN email_verification_expires_at`);
  await pool.query(`ALTER TABLE Users DROP COLUMN email_verification_code_hash`);
  await pool.query(`ALTER TABLE Users DROP COLUMN email_verified`);
}

module.exports = { name, up, down };
