const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const validate = require('../middleware/validate');
const {
  createCheckoutSession,
  createOrderAfterPayment,
  getMyOrders,
  getAllOrdersController,
} = require('../controllers/orderController');

const router = express.Router();

// Patient routes
router.post(
  '/create-checkout-session',
  authMiddleware,
  roleMiddleware('patient'),
  [
    body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
    body('items.*.productId')
      .custom((value) => {
        const num = parseInt(value, 10);
        return !isNaN(num) && num > 0;
      })
      .withMessage('productId must be a positive integer'),
    body('items.*.quantity')
      .custom((value) => {
        const num = parseInt(value, 10);
        return !isNaN(num) && num > 0;
      })
      .withMessage('quantity must be a positive integer'),
  ],
  validate,
  createCheckoutSession
);

router.post(
  '/',
  authMiddleware,
  roleMiddleware('patient'),
  [
    body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
    body('items.*.productId').isInt().withMessage('productId must be an integer'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('quantity must be a positive integer'),
    body('items.*.price').isFloat({ min: 0 }).withMessage('price must be a positive number'),
    body('totalPrice').isFloat({ min: 0 }).withMessage('totalPrice must be a positive number'),
  ],
  validate,
  createOrderAfterPayment
);

router.get('/my', authMiddleware, roleMiddleware('patient'), getMyOrders);

// Admin routes
router.get('/admin/all', authMiddleware, roleMiddleware('admin'), getAllOrdersController);

module.exports = router;

