const name = '007_add_reviews';

async function up(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Reviews (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      patient_id INT UNSIGNED NOT NULL,
      appointment_id INT UNSIGNED NOT NULL,
      rating TINYINT UNSIGNED NOT NULL,
      comment TEXT NOT NULL,
      status ENUM('pending', 'approved') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_reviews_patient FOREIGN KEY (patient_id) REFERENCES Patients(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_reviews_appointment FOREIGN KEY (appointment_id) REFERENCES Appointments(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      UNIQUE KEY uq_reviews_appointment (appointment_id),
      INDEX idx_reviews_status_created (status, created_at),
      INDEX idx_reviews_patient_created (patient_id, created_at)
    ) ENGINE=InnoDB;
  `);
}

async function down(pool) {
  await pool.query('DROP TABLE IF EXISTS Reviews;');
}

module.exports = { name, up, down };

