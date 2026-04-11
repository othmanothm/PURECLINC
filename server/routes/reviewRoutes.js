const express = require('express');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const { requirePermission } = require('../middleware/authorize');
const { PERMISSION } = require('../constants/permissions');
const validate = require('../middleware/validate');
const { REVIEW_STATUSES } = require('../lib/reviewStatus');
const {
  createReviewController,
  listApprovedReviewsController,
  updateReviewStatusController,
} = require('../controllers/reviewController');

const router = express.Router();

// GET /api/reviews (public) - approved only
router.get(
  '/',
  [
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit must be an integer between 1 and 200'),
    query('offset').optional().isInt({ min: 0 }).withMessage('offset must be a non-negative integer'),
  ],
  validate,
  listApprovedReviewsController
);

// POST /api/reviews (patient only)
router.post(
  '/',
  authMiddleware,
  roleMiddleware('patient'),
  [
    body('appointmentId').isInt({ min: 1 }).withMessage('appointmentId must be a positive integer'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be between 1 and 5'),
    body('comment').trim().isLength({ min: 3, max: 2000 }).withMessage('comment must be between 3 and 2000 characters'),
  ],
  validate,
  createReviewController
);

// PATCH /api/reviews/:id/status (admin + manage_reviews)
router.patch(
  '/:id/status',
  authMiddleware,
  roleMiddleware('admin'),
  requirePermission(PERMISSION.ADMIN_MANAGE_REVIEWS),
  [
    param('id').isInt({ min: 1 }).withMessage('id must be a positive integer'),
    body('status')
      .isIn([...REVIEW_STATUSES])
      .withMessage(`status must be one of: ${REVIEW_STATUSES.join(', ')}`),
  ],
  validate,
  updateReviewStatusController
);

module.exports = router;

