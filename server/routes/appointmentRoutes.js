const express = require('express');
const { body, query } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const validate = require('../middleware/validate');
const {
  getDoctors,
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  getDoctorAppointmentsList,
  updateAppointmentStatusController,
} = require('../controllers/appointmentController');

const router = express.Router();

// Public: Get doctors list
router.get('/doctors', getDoctors);

// Public: Get available slots
router.get('/slots', [
  query('doctorId').isInt().withMessage('doctorId must be an integer'),
  query('date').isISO8601().withMessage('date must be a valid ISO date'),
], validate, getAvailableSlots);

// Patient routes
router.use(authMiddleware);

// Patient: Book appointment
router.post(
  '/',
  roleMiddleware('patient'),
  [
    body('doctorId').isInt().withMessage('doctorId must be an integer'),
    body('appointmentDate').isISO8601().toDate().withMessage('appointmentDate must be a valid date'),
    body('appointmentTime').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('appointmentTime must be in HH:MM format'),
  ],
  validate,
  bookAppointment
);

// Patient: Get my appointments
router.get('/my', roleMiddleware('patient'), getMyAppointments);

// Doctor routes
router.get('/doctor/list', roleMiddleware('doctor'), getDoctorAppointmentsList);
router.put(
  '/:id/status',
  roleMiddleware('doctor'),
  [
    body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled']).withMessage('Invalid status'),
  ],
  validate,
  updateAppointmentStatusController
);

module.exports = router;

