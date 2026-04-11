-- PureSkin Clinic - Database Schema

CREATE DATABASE IF NOT EXISTS pureskin_clinic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pureskin_clinic;

-- Users
CREATE TABLE IF NOT EXISTS Users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('patient', 'doctor', 'admin') NOT NULL DEFAULT 'patient',
  admin_role ENUM(
    'super_admin',
    'store_manager',
    'catalog_manager',
    'inventory_manager',
    'order_manager',
    'support_staff'
  ) NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Patients
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

-- MedicalRecords
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

-- Doctors
CREATE TABLE IF NOT EXISTS Doctors (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  specialization VARCHAR(150),
  CONSTRAINT fk_doctors_user FOREIGN KEY (user_id) REFERENCES Users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Appointments
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

-- Treatment sessions (clinical / billing activity per appointment; required evidence before appointment may be completed)
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

-- Messages
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

-- Products (discount_percentage / is_active / short_description / low_stock_threshold: migrations 002, 011, 013)
CREATE TABLE IF NOT EXISTS Products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  short_description VARCHAR(500) NULL,
  category ENUM('Skin Care', 'Hair Care', 'Body Care') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  low_stock_threshold INT UNSIGNED NULL,
  image_url VARCHAR(255),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  INDEX idx_products_category (category),
  INDEX idx_products_active (is_active)
) ENGINE=InnoDB;

-- Orders (payment + Stripe columns: see migrations 003, 010)
CREATE TABLE IF NOT EXISTS Orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status ENUM('awaiting_payment', 'pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_status ENUM('unpaid', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'unpaid',
  payment_method VARCHAR(50) DEFAULT 'cash_on_delivery',
  phone VARCHAR(30),
  address TEXT,
  admin_notes TEXT NULL,
  stripe_checkout_session_id VARCHAR(255) NULL,
  stripe_payment_intent_id VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_patient FOREIGN KEY (patient_id) REFERENCES Patients(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_orders_status_created (status, created_at),
  INDEX idx_orders_payment_status (payment_status),
  UNIQUE KEY uq_orders_stripe_checkout_session_id (stripe_checkout_session_id)
) ENGINE=InnoDB;

-- OrderItems (original_price / discount on lines: migration 004)
CREATE TABLE IF NOT EXISTS OrderItems (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) DEFAULT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT NULL,
  CONSTRAINT fk_orderitems_order FOREIGN KEY (order_id) REFERENCES Orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_orderitems_product FOREIGN KEY (product_id) REFERENCES Products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Stripe webhook idempotency (migration 010)
CREATE TABLE IF NOT EXISTS StripeWebhookEvents (
  stripe_event_id VARCHAR(255) NOT NULL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Stock adjustment audit log (migration 015)
CREATE TABLE IF NOT EXISTS ProductStockAdjustments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  delta INT NOT NULL,
  reason VARCHAR(500) NULL,
  created_by_user_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_psa_product FOREIGN KEY (product_id) REFERENCES Products(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_psa_user FOREIGN KEY (created_by_user_id) REFERENCES Users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_psa_product (product_id),
  INDEX idx_psa_created (created_at)
) ENGINE=InnoDB;

-- Reviews (patient reviews for appointments)
CREATE TABLE IF NOT EXISTS Reviews (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  appointment_id INT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comment TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'hidden', 'flagged') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_patient FOREIGN KEY (patient_id) REFERENCES Patients(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_appointment FOREIGN KEY (appointment_id) REFERENCES Appointments(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_reviews_appointment (appointment_id),
  INDEX idx_reviews_status_created (status, created_at),
  INDEX idx_reviews_patient_created (patient_id, created_at)
) ENGINE=InnoDB;


