// Initial schema migration: creates all core tables if they don't exist.

const sql = `
CREATE TABLE IF NOT EXISTS Users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('patient', 'doctor', 'admin') NOT NULL DEFAULT 'patient',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Patients (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  phone VARCHAR(30),
  date_of_birth DATE,
  address VARCHAR(255),
  general_health TEXT,
  CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES Users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS MedicalRecords (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  skin_type VARCHAR(100),
  complaints TEXT,
  dermatological_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  pregnancy_status VARCHAR(50),
  notes TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_medicalrecords_patient FOREIGN KEY (patient_id) REFERENCES Patients(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Doctors (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  specialization VARCHAR(150),
  CONSTRAINT fk_doctors_user FOREIGN KEY (user_id) REFERENCES Users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Appointments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  doctor_id INT UNSIGNED NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES Patients(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES Doctors(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_appointments_patient_date (patient_id, appointment_date),
  INDEX idx_appointments_doctor_date (doctor_id, appointment_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sender_id INT UNSIGNED NOT NULL,
  receiver_id INT UNSIGNED NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES Users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES Users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_messages_participants (sender_id, receiver_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  category ENUM('Skin Care', 'Hair Care', 'Body Care') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  image_url VARCHAR(255),
  INDEX idx_products_category (category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'paid', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_patient FOREIGN KEY (patient_id) REFERENCES Patients(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_orders_status_created (status, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS OrderItems (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_orderitems_order FOREIGN KEY (order_id) REFERENCES Orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_orderitems_product FOREIGN KEY (product_id) REFERENCES Products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;
`;

module.exports = {
  name: '001_init_schema',
  /**
   * @param {import('mysql2/promise').Pool} pool
   */
  async up(pool) {
    await pool.query(sql);
  },
};


