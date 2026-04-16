/**
 * Track one-time "approaching appointment" reminder email per booking.
 */

const name = '018_appointments_reminder_email';

async function up(pool) {
  const [cols] = await pool.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Appointments' AND COLUMN_NAME = 'reminder_email_sent_at'
  `);
  if (cols.length === 0) {
    await pool.query(`
      ALTER TABLE Appointments
      ADD COLUMN reminder_email_sent_at DATETIME NULL DEFAULT NULL
      AFTER status
    `);
  }
}

async function down(pool) {
  await pool.query(`ALTER TABLE Appointments DROP COLUMN reminder_email_sent_at`);
}

module.exports = { name, up, down };
