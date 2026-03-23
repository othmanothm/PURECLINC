const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  register,
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

// POST /api/auth/login – login for all roles
router.post('/login', [emailValidator, passwordValidator], validate, login);

// POST /api/auth/admin-login – optional admin-only login
router.post('/admin-login', [emailValidator, passwordValidator], validate, adminLogin);

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


