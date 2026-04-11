const name = '009_normalize_legacy_appointment_status_labels';

/**
 * Fixes historical typo/verb labels if they ever existed (VARCHAR or old ENUM values).
 * Safe when column is already canonical ENUM: updates match 0 rows.
 */
async function up(pool) {
  await pool.query(`
    UPDATE Appointments
    SET status = 'confirmed'
    WHERE status IN ('confirm', 'Confirm', 'CONFIRM')
  `);
  await pool.query(`
    UPDATE Appointments
    SET status = 'cancelled'
    WHERE status IN ('cancel', 'Cancel', 'CANCEL')
  `);

  await pool.query(`
    ALTER TABLE Appointments
    MODIFY COLUMN status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending'
  `);
}

async function down(pool) {
  // Cannot restore legacy labels reliably; schema down is same as 008 pattern.
  await pool.query(`
    ALTER TABLE Appointments
    MODIFY COLUMN status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending'
  `);
}

module.exports = { name, up, down };
