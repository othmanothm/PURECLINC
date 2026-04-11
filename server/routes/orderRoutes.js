const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const validate = require('../middleware/validate');
const {
  createCheckoutSession,
  previewCheckout,
  getOrderBySessionForPatient,
  getMyOrders,
  getAllOrdersController,
} = require('../controllers/orderController');

const router = express.Router();

const checkoutItemsValidation = [
  body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
  body('items.*.productId')
    .custom((value) => {
      const num = parseInt(value, 10);
      return !Number.isNaN(num) && num > 0;
    })
    .withMessage('productId must be a positive integer'),
  body('items.*.quantity')
    .custom((value) => {
      const num = parseInt(value, 10);
      return !Number.isNaN(num) && num > 0;
    })
    .withMessage('quantity must be a positive integer'),
];

// Patient routes
router.post(
  '/create-checkout-session',
  authMiddleware,
  roleMiddleware('patient'),
  checkoutItemsValidation,
  validate,
  createCheckoutSession
);

router.post(
  '/checkout-preview',
  authMiddleware,
  roleMiddleware('patient'),
  checkoutItemsValidation,
  validate,
  previewCheckout
);

router.get(
  '/by-session/:sessionId',
  authMiddleware,
  roleMiddleware('patient'),
  getOrderBySessionForPatient
);

router.get('/my', authMiddleware, roleMiddleware('patient'), getMyOrders);

// Admin (single list endpoint — avoid duplicate /api/orders/admin/all)
router.get('/admin/all', authMiddleware, roleMiddleware('admin'), getAllOrdersController);

module.exports = router;
