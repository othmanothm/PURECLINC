const { getDb } = require('../config/db');

async function createAppointment({ patientId, doctorId, appointmentDate, appointmentTime, status = 'pending' }) {
  const db = getDb();
  const [result] = await db.query(
    `INSERT INTO Appointments (patient_id, doctor_id, appointment_date, appointment_time, status)
     VALUES (?, ?, ?, ?, ?)`,
    [patientId, doctorId, appointmentDate, appointmentTime, status]
  );
  return { id: result.insertId, patient_id: patientId, doctor_id: doctorId };
}

async function getAppointmentById(appointmentId) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT a.*, 
     p.user_id as patient_user_id,
     u_p.name as patient_name,
     u_d.name as doctor_name,
     d.specialization
     FROM Appointments a
     JOIN Patients p ON a.patient_id = p.id
     JOIN Users u_p ON p.user_id = u_p.id
     JOIN Doctors d ON a.doctor_id = d.id
     JOIN Users u_d ON d.user_id = u_d.id
     WHERE a.id = ?`,
    [appointmentId]
  );
  return rows[0] || null;
}

async function getPatientAppointments(patientId) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT a.*, 
     u_d.name as doctor_name,
     d.specialization
     FROM Appointments a
     JOIN Doctors d ON a.doctor_id = d.id
     JOIN Users u_d ON d.user_id = u_d.id
     WHERE a.patient_id = ?
     ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
    [patientId]
  );
  return rows;
}

async function getDoctorAppointments(doctorId) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT a.*, 
     u_p.name as patient_name,
     p.phone as patient_phone
     FROM Appointments a
     JOIN Patients p ON a.patient_id = p.id
     JOIN Users u_p ON p.user_id = u_p.id
     WHERE a.doctor_id = ?
     ORDER BY a.appointment_date ASC, a.appointment_time ASC`,
    [doctorId]
  );
  return rows;
}

async function getAppointmentsByDateAndDoctor(doctorId, date) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT appointment_time, status
     FROM Appointments
     WHERE doctor_id = ? AND appointment_date = ?
     ORDER BY appointment_time`,
    [doctorId, date]
  );
  return rows;
}

async function updateAppointmentStatus(appointmentId, status) {
  const db = getDb();
  await db.query('UPDATE Appointments SET status = ? WHERE id = ?', [
    status,
    appointmentId,
  ]);
  return getAppointmentById(appointmentId);
}

module.exports = {
  createAppointment,
  getAppointmentById,
  getPatientAppointments,
  getDoctorAppointments,
  getAppointmentsByDateAndDoctor,
  updateAppointmentStatus,
};

