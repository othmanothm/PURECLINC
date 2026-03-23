const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const {
  getStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getDoctorsList,
  createDoctorController,
  updateDoctorController,
  deleteDoctorController,
} = require('../controllers/adminController');
const {
  getProducts,
  getProduct,
  createProductController,
  updateProductController,
  deleteProductController,
} = require('../controllers/productController');
const { getAllOrdersController, updateOrderStatusController } = require('../controllers/orderController');

const router = express.Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Stats
router.get('/stats/overview', getStats);

// Users
router.get('/users', getAllUsers);
router.patch('/users/:id', [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail(),
  body('role').optional().isIn(['patient', 'doctor', 'admin']),
], validate, updateUser);
router.delete('/users/:id', deleteUser);

// Doctors
router.get('/doctors', getDoctorsList);
router.post('/doctors', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').trim().notEmpty().withMessage('name is required'),
  body('specialization').optional().isString(),
], validate, createDoctorController);
router.put('/doctors/:id', [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail(),
  body('specialization').optional().isString(),
], validate, updateDoctorController);
router.delete('/doctors/:id', deleteDoctorController);

// Products
router.get('/products', getProducts);
router.get('/products/:id', getProduct);
router.post(
  '/products',
  upload.single('image'),
  [
    body('name').trim().notEmpty().withMessage('name is required'),
    body('category').isIn(['Skin Care', 'Hair Care', 'Body Care']).withMessage('Invalid category'),
    body('price')
      .customSanitizer((value) => {
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? value : parsed;
        }
        return value;
      })
      .isFloat({ min: 0 })
      .withMessage('price must be a positive number'),
    body('stock')
      .optional()
      .customSanitizer((value) => {
        if (value === '' || value === null || value === undefined) return undefined;
        if (typeof value === 'string') {
          const parsed = parseInt(value);
          return isNaN(parsed) ? value : parsed;
        }
        return value;
      })
      .isInt({ min: 0 })
      .withMessage('stock must be a non-negative integer'),
    body('discountPercentage')
      .optional()
      .customSanitizer((value) => {
        if (value === '' || value === null || value === undefined) return 0;
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? 0 : parsed;
        }
        return value;
      })
      .isFloat({ min: 0, max: 100 })
      .withMessage('discountPercentage must be between 0 and 100'),
  ],
  validate,
  createProductController
);
router.put(
  '/products/:id',
  upload.single('image'),
  [
    body('category').optional().isIn(['Skin Care', 'Hair Care', 'Body Care']).withMessage('Invalid category'),
    body('price')
      .optional()
      .customSanitizer((value) => {
        if (value === '' || value === null || value === undefined) return undefined;
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? value : parsed;
        }
        return value;
      })
      .isFloat({ min: 0 })
      .withMessage('price must be a positive number'),
    body('stock')
      .optional()
      .customSanitizer((value) => {
        if (value === '' || value === null || value === undefined) return undefined;
        if (typeof value === 'string') {
          const parsed = parseInt(value);
          return isNaN(parsed) ? value : parsed;
        }
        return value;
      })
      .isInt({ min: 0 })
      .withMessage('stock must be a non-negative integer'),
    body('discountPercentage')
      .optional()
      .customSanitizer((value) => {
        if (value === '' || value === null || value === undefined) return undefined;
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? value : parsed;
        }
        return value;
      })
      .isFloat({ min: 0, max: 100 })
      .withMessage('discountPercentage must be between 0 and 100'),
  ],
  validate,
  updateProductController
);
router.delete('/products/:id', deleteProductController);

// Orders
router.get('/orders', getAllOrdersController);
router.patch('/orders/:orderId/status', [
  body('status').isIn(['pending', 'confirmed', 'paid', 'cancelled']).withMessage('Invalid status'),
], validate, updateOrderStatusController);

module.exports = router;

