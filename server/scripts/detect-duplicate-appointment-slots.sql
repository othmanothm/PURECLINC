-- Detect duplicate active (blocking) appointments for the same doctor/date/time.
-- Run: mysql -u root -p pureskin_clinic < server/scripts/detect-duplicate-appointment-slots.sql

USE pureskin_clinic;

SELECT
  doctor_id,
  DATE(appointment_date) AS d,
  TIME_FORMAT(appointment_time, '%H:%i') AS t,
  COUNT(*) AS cnt,
  GROUP_CONCAT(CONCAT(id, ':', status) ORDER BY id) AS appointments
FROM Appointments
WHERE LOWER(TRIM(status)) IN ('pending', 'confirmed', 'completed')
GROUP BY doctor_id, DATE(appointment_date), TIME_FORMAT(appointment_time, '%H:%i')
HAVING COUNT(*) > 1;
