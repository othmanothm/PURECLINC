const express = require('express');
const { body, query } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const requireDb = require('../middleware/requireDb');
const validate = require('../middleware/validate');
const {
  getDoctors,
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  getDoctorAppointmentsList,
  updateAppointmentStatusController,
} = require('../controllers/appointmentController');
const { ALL_STATUSES } = require('../constants/appointmentStatus');
const { normalizeAppointmentDate } = require('../lib/appointmentTime');

const router = express.Router();

router.use(requireDb);

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
    body('appointmentDate')
      .customSanitizer((value) => normalizeAppointmentDate(value))
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('appointmentDate must be YYYY-MM-DD'),
    body('appointmentTime').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('appointmentTime must be in HH:MM format'),
    body('treatmentCategory').isIn(['hair', 'skin', 'body']).withMessage('treatmentCategory must be hair, skin, or body'),
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
    body('status').isIn([...ALL_STATUSES]).withMessage('Invalid status'),
  ],
  validate,
  updateAppointmentStatusController
);

module.exports = router;

