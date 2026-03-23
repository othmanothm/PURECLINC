const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const {
  getProducts,
  getProduct,
  createProductController,
  updateProductController,
  deleteProductController,
} = require('../controllers/productController');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Admin routes
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.post(
  '/',
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
  '/:id',
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

router.delete('/:id', deleteProductController);

module.exports = router;

