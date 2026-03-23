const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const validate = require('../middleware/validate');
const {
  getMyProfile,
  updateMyProfile,
  updateMyMedicalRecord,
} = require('../controllers/patientController');

const router = express.Router();

// All routes require authentication and patient role
router.use(authMiddleware);
router.use(roleMiddleware('patient'));

// GET /api/patients/me - get current patient profile + medical record
router.get('/me', getMyProfile);

// PUT /api/patients/me/profile - update patient profile
router.put(
  '/me/profile',
  [
    body('phone').optional().isString(),
    body('dateOfBirth').optional().isISO8601().toDate(),
    body('address').optional().isString(),
    body('generalHealth').optional().isString(),
  ],
  validate,
  updateMyProfile
);

// PUT /api/patients/me/medical-record - create/update medical record
router.put(
  '/me/medical-record',
  [
    body('skinType').optional().isString(),
    body('complaints').optional().isString(),
    body('dermatologicalHistory').optional().isString(),
    body('allergies').optional().isString(),
    body('currentMedications').optional().isString(),
    body('pregnancyStatus').optional().isString(),
    body('notes').optional().isString(),
  ],
  validate,
  updateMyMedicalRecord
);

module.exports = router;

