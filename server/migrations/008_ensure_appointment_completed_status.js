const name = '008_ensure_appointment_completed_status';

async function up(pool) {
  await pool.query(`
    ALTER TABLE Appointments
    MODIFY COLUMN status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending'
  `);
}

async function down(pool) {
  await pool.query(`
    UPDATE Appointments SET status = 'confirmed' WHERE status = 'completed'
  `);
  await pool.query(`
    ALTER TABLE Appointments
    MODIFY COLUMN status ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending'
  `);
}

module.exports = { name, up, down };
