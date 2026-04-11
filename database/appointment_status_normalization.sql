-- ---------------------------------------------------------------------------
-- Appointment status: canonical values & legacy normalization (reference)
-- Canonical: pending | confirmed | cancelled | completed
-- ---------------------------------------------------------------------------

-- 1) Normalize legacy verb-style values (only needed if column allowed them, e.g. VARCHAR)
UPDATE Appointments
SET status = 'confirmed'
WHERE status IN ('confirm', 'Confirm', 'CONFIRM');

UPDATE Appointments
SET status = 'cancelled'
WHERE status IN ('cancel', 'Cancel', 'CANCEL');

-- 2) Ensure ENUM includes `completed` and uses normalized labels (MySQL / InnoDB)
ALTER TABLE Appointments
MODIFY COLUMN status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending';

-- Notes:
-- * If your column is still VARCHAR, run steps (1) then ALTER to ENUM as above.
-- * If ENUM temporarily listed only legacy values, expand ENUM first, UPDATE, then trim ENUM.

-- ---------------------------------------------------------------------------
-- TreatmentSessions ↔ Appointments (reference)
-- ---------------------------------------------------------------------------
-- Ensure table exists and appointment_id references Appointments(id):
--
-- CREATE TABLE IF NOT EXISTS TreatmentSessions (
--   id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
--   appointment_id INT UNSIGNED NOT NULL,
--   session_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
--   amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
--   notes TEXT,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   CONSTRAINT fk_treatments_appointment FOREIGN KEY (appointment_id)
--     REFERENCES Appointments(id) ON DELETE CASCADE ON UPDATE CASCADE,
--   INDEX idx_treatments_appointment (appointment_id)
-- ) ENGINE=InnoDB;
--
-- Application rule: appointment may move to `completed` only if at least one session
-- documents price, payment, or notes (see server treatmentModel + appointmentCompletionGate).

-- ---------------------------------------------------------------------------
-- Reviews ↔ Appointments (reference)
-- ---------------------------------------------------------------------------
-- Reviews.appointment_id UNIQUE → one review per appointment; patient may review only when
-- appointment.status = 'completed'.
