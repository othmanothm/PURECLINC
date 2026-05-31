const { getAllDoctors, getDoctorByUserId } = require('../models/doctorModel');
const {
  createAppointment,
  findBlockingAppointment,
  getBlockedSlotTimesForDoctorDate,
  normalizeAppointmentDate,
  normalizeAppointmentTime,
  getAppointmentById,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
} = require('../models/appointmentModel');
const { getPatientByUserId } = require('../models/patientModel');
const {
  APPOINTMENT_STATUS,
  isValidAppointmentStatus,
  canTransitionTo,
} = require('../constants/appointmentStatus');
const { assertDoctorMaySetAppointmentCompleted } = require('../lib/appointmentCompletionGate');
const {
  notifyAppointmentBooked,
  notifyAppointmentConfirmed,
} = require('../services/emailNotifications');

// Available time slots (9 AM to 5 PM, hourly)
const TIME_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

async function getDoctors(req, res, next) {
  try {
    const doctors = await getAllDoctors();
    return res.json({ doctors });
  } catch (err) {
    return next(err);
  }
}

async function getAvailableSlots(req, res, next) {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ message: 'doctorId and date are required' });
    }

    const blockedTimes = await getBlockedSlotTimesForDoctorDate(doctorId, date);
    const bookedTimes = new Set(blockedTimes);

    const availableSlots = TIME_SLOTS.filter((slot) => !bookedTimes.has(slot));

    return res.json({ slots: availableSlots });
  } catch (err) {
    return next(err);
  }
}

async function bookAppointment(req, res, next) {
  try {
    const userId = req.user.id;
    const patient = await getPatientByUserId(userId);

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const { treatmentCategory } = req.body;

    const doctorId = parseInt(req.body.doctorId, 10);
    const appointmentDate = normalizeAppointmentDate(req.body.appointmentDate);
    const appointmentTime = normalizeAppointmentTime(req.body.appointmentTime);

    const blockingAppointment = await findBlockingAppointment(
      doctorId,
      appointmentDate,
      appointmentTime
    );

    console.log('[appointment-slot-check]', {
      doctorIdRaw: req.body.doctorId,
      doctorIdNormalized: doctorId,
      appointmentDateRaw: req.body.appointmentDate,
      appointmentDateNormalized: appointmentDate,
      appointmentTimeRaw: req.body.appointmentTime,
      appointmentTimeNormalized: appointmentTime,
      blockingFound: Boolean(blockingAppointment),
      blockingAppointmentId: blockingAppointment?.id,
      blockingStatus: blockingAppointment?.status,
    });

    if (blockingAppointment) {
      return res.status(409).json({ message: 'Time slot is already booked' });
    }

    const appointment = await createAppointment({
      patientId: patient.id,
      doctorId,
      appointmentDate,
      appointmentTime,
      treatmentCategory,
      status: APPOINTMENT_STATUS.PENDING,
    });

    const fullApt = await getAppointmentById(appointment.id);
    if (fullApt && fullApt.patient_email) {
      try {
        await notifyAppointmentBooked({
          to: fullApt.patient_email,
          patientName: fullApt.patient_name || 'Patient',
          doctorName: fullApt.doctor_name || 'Doctor',
          specialization: fullApt.specialization,
          date: appointmentDate,
          time: appointmentTime,
          treatmentCategory,
          statusNote:
            'We received your appointment request. It is pending confirmation by the clinic.',
        });
      } catch (mailErr) {
        console.error('[email] appointment booked:', mailErr.message || mailErr);
      }
    }

    return res.status(201).json({ appointment });
  } catch (err) {
    if (err.status === 409) {
      return res.status(409).json({ message: err.message || 'Time slot is already booked' });
    }
    return next(err);
  }
}

async function getMyAppointments(req, res, next) {
  try {
    const userId = req.user.id;
    const patient = await getPatientByUserId(userId);

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const appointments = await getPatientAppointments(patient.id);
    return res.json({ appointments });
  } catch (err) {
    return next(err);
  }
}

async function getDoctorAppointmentsList(req, res, next) {
  try {
    const doctor = await getDoctorByUserId(req.user.id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const appointments = await getDoctorAppointments(doctor.id);
    return res.json({ appointments });
  } catch (err) {
    return next(err);
  }
}

async function updateAppointmentStatusController(req, res, next) {
  try {
    const appointmentId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!Number.isFinite(appointmentId) || appointmentId < 1) {
      return res.status(400).json({ message: 'Invalid appointment id' });
    }

    if (!isValidAppointmentStatus(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const doctor = await getDoctorByUserId(req.user.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const existing = await getAppointmentById(appointmentId);
    if (!existing) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (existing.doctor_id !== doctor.id) {
      return res.status(403).json({ message: 'Not allowed to update this appointment' });
    }

    const current = existing.status;

    if (!isValidAppointmentStatus(current)) {
      return res.status(409).json({
        message:
          'Appointment has an unrecognized status; run DB normalization migrations or contact support.',
      });
    }

    if (current === status) {
      return res.json({ appointment: existing });
    }

    if (!canTransitionTo(current, status)) {
      return res.status(400).json({ message: 'Invalid status transition' });
    }

    if (status === APPOINTMENT_STATUS.COMPLETED) {
      const completion = await assertDoctorMaySetAppointmentCompleted(appointmentId);
      if (!completion.ok) {
        return res.status(completion.status).json({ message: completion.message });
      }
    }

    const appointment = await updateAppointmentStatus(appointmentId, status);

    if (status === APPOINTMENT_STATUS.CONFIRMED && appointment && appointment.patient_email) {
      try {
        await notifyAppointmentConfirmed({
          to: appointment.patient_email,
          patientName: appointment.patient_name || 'Patient',
          doctorName: appointment.doctor_name || 'Doctor',
          specialization: appointment.specialization,
          date: appointment.appointment_date,
          time: appointment.appointment_time,
        });
      } catch (mailErr) {
        console.error('[email] appointment confirmed:', mailErr.message || mailErr);
      }
    }

    return res.json({ appointment });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getDoctors,
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  getDoctorAppointmentsList,
  updateAppointmentStatusController,
};

