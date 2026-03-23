const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const validate = require('../middleware/validate');
const {
  getMyProfile,
  getMyAppointments,
  getPatients,
  getPatientRecord,
  updatePatientNotes,
  createOrUpdateTreatment,
} = require('../controllers/doctorController');

const router = express.Router();

// All routes require authentication and doctor role
router.use(authMiddleware);
router.use(roleMiddleware('doctor'));

router.get('/me', getMyProfile);
router.get('/appointments', getMyAppointments);
router.get('/patients', getPatients);
router.get('/patients/:patientId', getPatientRecord);
router.put(
  '/patients/:patientId/notes',
  [body('notes').optional().isString()],
  validate,
  updatePatientNotes
);
router.post(
  '/appointments/:appointmentId/treatment',
  [
    body('sessionPrice').optional().isFloat({ min: 0 }).withMessage('sessionPrice must be a positive number'),
    body('amountPaid').optional().isFloat({ min: 0 }).withMessage('amountPaid must be a positive number'),
    body('notes').optional().isString(),
  ],
  validate,
  createOrUpdateTreatment
);

module.exports = router;

