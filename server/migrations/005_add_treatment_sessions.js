const name = '005_add_treatment_sessions';

async function up(pool) {
  console.log(`Running migration: ${name}`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS TreatmentSessions (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      appointment_id INT UNSIGNED NOT NULL,
      session_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_treatments_appointment FOREIGN KEY (appointment_id) REFERENCES Appointments(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      INDEX idx_treatments_appointment (appointment_id)
    ) ENGINE=InnoDB;
  `);
  console.log(`Migration ${name} completed.`);
}

async function down(pool) {
  console.log(`Reverting migration: ${name}`);
  await pool.query(`DROP TABLE IF EXISTS TreatmentSessions;`);
  console.log(`Migration ${name} reverted.`);
}

module.exports = { name, up, down };

