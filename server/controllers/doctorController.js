const { getDoctorByUserId } = require('../models/doctorModel');
const {
  getDoctorAppointments,
  getDoctorAppointmentsWithCompletionHints,
  updateAppointmentStatus,
} = require('../models/appointmentModel');
const { APPOINTMENT_STATUS } = require('../constants/appointmentStatus');
const { getPatientById, getPatientByUserId } = require('../models/patientModel');
const { getMedicalRecordByPatientId } = require('../models/medicalRecordModel');
const { updateMedicalRecord } = require('../models/medicalRecordModel');

async function getMyProfile(req, res, next) {
  try {
    const doctor = await getDoctorByUserId(req.user.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }
    return res.json({ doctor });
  } catch (err) {
    return next(err);
  }
}

async function getMyAppointments(req, res, next) {
  try {
    const doctor = await getDoctorByUserId(req.user.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const appointments = await getDoctorAppointmentsWithCompletionHints(doctor.id);
    return res.json({ appointments });
  } catch (err) {
    return next(err);
  }
}

async function getPatients(req, res, next) {
  try {
    const doctor = await getDoctorByUserId(req.user.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Get patients who have appointments with this doctor
    const appointments = await getDoctorAppointments(doctor.id);
    const patientIds = [...new Set(appointments.map((apt) => apt.patient_id))];

    const { getDb } = require('../config/db');
    const db = getDb();
    const [patients] = await db.query(
      `SELECT DISTINCT p.*, u.name, u.email
       FROM Patients p
       JOIN Users u ON p.user_id = u.id
       WHERE p.id IN (${patientIds.length > 0 ? patientIds.join(',') : '0'})
       ORDER BY u.name`
    );

    return res.json({ patients });
  } catch (err) {
    return next(err);
  }
}

async function getPatientRecord(req, res, next) {
  try {
    const { patientId } = req.params;
    const patient = await getPatientById(parseInt(patientId));

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const medicalRecord = await getMedicalRecordByPatientId(patient.id);

    // Get patient appointments with this doctor
    const doctor = await getDoctorByUserId(req.user.id);
    const { getDb } = require('../config/db');
    const db = getDb();
    const [appointments] = await db.query(
      `SELECT a.*, d.specialization, u.name as doctor_name
       FROM Appointments a
       JOIN Doctors d ON a.doctor_id = d.id
       JOIN Users u ON d.user_id = u.id
       WHERE a.patient_id = ? AND a.doctor_id = ?
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [patient.id, doctor.id]
    );

    // Get treatment sessions for each appointment
    const { getTreatmentByAppointmentId } = require('../models/treatmentModel');
    const appointmentsWithTreatments = await Promise.all(
      appointments.map(async (apt) => {
        const treatment = await getTreatmentByAppointmentId(apt.id);
        return { ...apt, treatment: treatment || null };
      })
    );

    // Calculate total paid from treatments
    const totalPaid = appointmentsWithTreatments
      .filter(apt => apt.treatment)
      .reduce((sum, apt) => sum + parseFloat(apt.treatment.amount_paid || 0), 0);

    // Calculate total session prices
    const totalSessionsPrice = appointmentsWithTreatments
      .filter(apt => apt.treatment)
      .reduce((sum, apt) => sum + parseFloat(apt.treatment.session_price || 0), 0);

    return res.json({
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        date_of_birth: patient.date_of_birth,
        address: patient.address,
        general_health: patient.general_health,
      },
      medicalRecord: medicalRecord || null,
      appointments: appointmentsWithTreatments || [],
      totalPaid: totalPaid,
      totalSessionsPrice: totalSessionsPrice,
    });
  } catch (err) {
    return next(err);
  }
}

async function updatePatientNotes(req, res, next) {
  try {
    const { patientId } = req.params;
    const { notes } = req.body;

    const patient = await getPatientById(parseInt(patientId));
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    let medicalRecord = await getMedicalRecordByPatientId(patient.id);
    if (!medicalRecord) {
      const { createMedicalRecord } = require('../models/medicalRecordModel');
      medicalRecord = await createMedicalRecord({
        patientId: patient.id,
        notes: notes || null,
      });
    } else {
      medicalRecord = await updateMedicalRecord(patient.id, {
        notes: notes || null,
      });
    }

    return res.json({ medicalRecord });
  } catch (err) {
    return next(err);
  }
}

async function createOrUpdateTreatment(req, res, next) {
  try {
    const { appointmentId } = req.params;
    const { sessionPrice, amountPaid, notes, completeAppointment } = req.body;

    // Verify appointment belongs to this doctor
    const doctor = await getDoctorByUserId(req.user.id);
    const { getDb } = require('../config/db');
    const db = getDb();
    const [appointments] = await db.query(
      'SELECT * FROM Appointments WHERE id = ? AND doctor_id = ?',
      [appointmentId, doctor.id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointmentRow = appointments[0];
    const aptIdNum = parseInt(appointmentId, 10);

    const {
      getTreatmentByAppointmentId,
      createTreatment,
      updateTreatment,
      appointmentHasTreatmentEvidenceForCompletion,
    } = require('../models/treatmentModel');
    let treatment = await getTreatmentByAppointmentId(aptIdNum);

    if (treatment) {
      treatment = await updateTreatment(treatment.id, {
        sessionPrice: sessionPrice !== undefined ? parseFloat(sessionPrice) : undefined,
        amountPaid: amountPaid !== undefined ? parseFloat(amountPaid) : undefined,
        notes: notes !== undefined ? notes : undefined,
      });
    } else {
      treatment = await createTreatment({
        appointmentId: aptIdNum,
        sessionPrice: parseFloat(sessionPrice) || 0,
        amountPaid: parseFloat(amountPaid) || 0,
        notes: notes || null,
      });
    }

    let appointment = null;
    if (completeAppointment === true) {
      if (appointmentRow.status !== APPOINTMENT_STATUS.CONFIRMED) {
        return res.status(400).json({
          message: 'Only confirmed appointments can be marked completed after saving treatment.',
        });
      }
      const hasEvidence = await appointmentHasTreatmentEvidenceForCompletion(aptIdNum);
      if (!hasEvidence) {
        return res.status(400).json({
          message:
            'Treatment must include session price, amount paid, or clinical notes (3+ characters) before completion.',
        });
      }
      appointment = await updateAppointmentStatus(aptIdNum, APPOINTMENT_STATUS.COMPLETED);
    }

    return res.json({ treatment, ...(appointment ? { appointment } : {}) });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getMyProfile,
  getMyAppointments,
  getPatients,
  getPatientRecord,
  updatePatientNotes,
  createOrUpdateTreatment,
};

