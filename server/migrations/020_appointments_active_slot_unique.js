/**
 * DB-level guard: one active (non-cancelled) booking per doctor + date + time.
 * active_slot_key is NULL when status = cancelled (multiple cancelled rows allowed).
 */

const name = '020_appointments_active_slot_unique';

async function up(pool) {
  const [cols] = await pool.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Appointments' AND COLUMN_NAME = 'active_slot_key'
  `);
  if (cols.length === 0) {
    await pool.query(`
      ALTER TABLE Appointments
      ADD COLUMN active_slot_key VARCHAR(80) AS (
        IF(
          status = 'cancelled',
          NULL,
          CONCAT(
            doctor_id,
            '|',
            DATE_FORMAT(appointment_date, '%Y-%m-%d'),
            '|',
            TIME_FORMAT(appointment_time, '%H:%i')
          )
        )
      ) STORED
    `);
  }

  const [dups] = await pool.query(`
    SELECT doctor_id,
           DATE(appointment_date) AS d,
           TIME_FORMAT(appointment_time, '%H:%i') AS t,
           COUNT(*) AS cnt,
           GROUP_CONCAT(CONCAT(id, ':', status) ORDER BY id) AS appointments
    FROM Appointments
    WHERE LOWER(TRIM(status)) IN ('pending', 'confirmed', 'completed')
    GROUP BY doctor_id, DATE(appointment_date), TIME_FORMAT(appointment_time, '%H:%i')
    HAVING COUNT(*) > 1
  `);

  if (dups.length > 0) {
    console.error(
      '[migration 020] DUPLICATE active appointment slots block unique index:',
      JSON.stringify(dups)
    );
    throw new Error(
      '020_appointments_active_slot_unique: duplicate doctor/date/time rows exist. ' +
        'Run server/scripts/detect-duplicate-appointment-slots.sql and cancel or merge duplicates, then restart.'
    );
  }

  const [idx] = await pool.query(`
    SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Appointments' AND INDEX_NAME = 'uq_appointments_active_slot_key'
  `);
  if (idx.length === 0) {
    await pool.query(`
      CREATE UNIQUE INDEX uq_appointments_active_slot_key ON Appointments (active_slot_key)
    `);
  }
}

async function down(pool) {
  const [idx] = await pool.query(`
    SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Appointments' AND INDEX_NAME = 'uq_appointments_active_slot_key'
  `);
  if (idx.length > 0) {
    await pool.query(`DROP INDEX uq_appointments_active_slot_key ON Appointments`);
  }

  const [cols] = await pool.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Appointments' AND COLUMN_NAME = 'active_slot_key'
  `);
  if (cols.length > 0) {
    await pool.query(`ALTER TABLE Appointments DROP COLUMN active_slot_key`);
  }
}

module.exports = { name, up, down };
