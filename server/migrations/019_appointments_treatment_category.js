/**
 * Patient-selected treatment focus: hair, skin, or body (public booking form).
 */

const name = '019_appointments_treatment_category';

async function up(pool) {
  const [cols] = await pool.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Appointments' AND COLUMN_NAME = 'treatment_category'
  `);
  if (cols.length === 0) {
    await pool.query(`
      ALTER TABLE Appointments
      ADD COLUMN treatment_category ENUM('hair', 'skin', 'body') NULL DEFAULT NULL
      AFTER appointment_time
    `);
  }
}

async function down(pool) {
  await pool.query(`ALTER TABLE Appointments DROP COLUMN treatment_category`);
}

module.exports = { name, up, down };
