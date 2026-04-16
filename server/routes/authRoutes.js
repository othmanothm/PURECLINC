const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  adminLogin,
  me,
  changePassword,
} = require('../controllers/authController');

const router = express.Router();

const emailValidator = body('email').isEmail().withMessage('Valid email is required');
const passwordValidator = body('password')
  .isLength({ min: 6 })
  .withMessage('Password must be at least 6 characters');
/** Login accepts shorter passwords (e.g. dev admin); registration stays at min 6. */
const loginPasswordValidator = body('password')
  .isLength({ min: 4 })
  .withMessage('Password must be at least 4 characters');

const verificationCodeValidator = body('code')
  .trim()
  .matches(/^\d{6}$/)
  .withMessage('Verification code must be 6 digits');

// POST /api/auth/register – patient registration only
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    emailValidator,
    passwordValidator,
  ],
  validate,
  register
);

// POST /api/auth/verify-email – patient completes email verification (returns JWT)
router.post(
  '/verify-email',
  [emailValidator, verificationCodeValidator],
  validate,
  verifyEmail
);

// POST /api/auth/resend-verification – new OTP for unverified patient
router.post('/resend-verification', [emailValidator], validate, resendVerificationEmail);

// POST /api/auth/login – login for all roles
router.post('/login', [emailValidator, loginPasswordValidator], validate, login);

// POST /api/auth/admin-login – optional admin-only login
router.post('/admin-login', [emailValidator, loginPasswordValidator], validate, adminLogin);

// GET /api/auth/me – current user info
router.get('/me', authMiddleware, me);

// PUT /api/auth/change-password – change password
router.put(
  '/change-password',
  authMiddleware,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  changePassword
);

module.exports = router;


