const { getAllDoctors } = require('../models/doctorModel');
const {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getAppointmentsByDateAndDoctor,
  updateAppointmentStatus,
} = require('../models/appointmentModel');
const { getPatientByUserId } = require('../models/patientModel');

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

    const bookedAppointments = await getAppointmentsByDateAndDoctor(
      parseInt(doctorId),
      date
    );
    const bookedTimes = new Set(
      bookedAppointments
        .filter((apt) => apt.status !== 'cancelled')
        .map((apt) => apt.appointment_time)
    );

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

    const { doctorId, appointmentDate, appointmentTime } = req.body;

    // Check if slot is available
    const booked = await getAppointmentsByDateAndDoctor(doctorId, appointmentDate);
    const isBooked = booked.some(
      (apt) =>
        apt.appointment_time === appointmentTime && apt.status !== 'cancelled'
    );

    if (isBooked) {
      return res.status(409).json({ message: 'Time slot is already booked' });
    }

    const appointment = await createAppointment({
      patientId: patient.id,
      doctorId,
      appointmentDate,
      appointmentTime,
      status: 'pending',
    });

    return res.status(201).json({ appointment });
  } catch (err) {
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
    const { getDoctorByUserId } = require('../models/doctorModel');
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
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const appointment = await updateAppointmentStatus(id, status);
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

