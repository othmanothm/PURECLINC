const express = require('express');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const { requirePermission } = require('../middleware/authorize');
const { PERMISSION } = require('../constants/permissions');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const {
  getStats,
  getPatientUserOptions,
  getStoreSummary,
  getAllUsers,
  updateUser,
  deleteUser,
  getPatientUserReviews,
  deleteAdminReview,
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
  adjustProductStockController,
} = require('../controllers/productController');
const {
  getAllOrdersController,
  getAdminOrderByIdController,
  updateOrderStatusController,
  patchAdminOrderNotesController,
  patchAdminOrderPaymentStatusController,
} = require('../controllers/orderController');
const { getPatientFinancialHistory } = require('../controllers/adminPatientBillingController');
const { REVIEW_STATUSES } = require('../lib/reviewStatus');

const router = express.Router();

const canViewProductsAdmin = requirePermission(
  PERMISSION.PRODUCTS_CREATE,
  PERMISSION.PRODUCTS_EDIT,
  PERMISSION.PRODUCTS_PUBLISH,
  PERMISSION.PRODUCTS_DELETE,
  PERMISSION.INVENTORY_VIEW
);

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get('/stats/overview', requirePermission(PERMISSION.REPORTS_VIEW), getStats);
router.get('/store/summary', requirePermission(PERMISSION.REPORTS_VIEW), getStoreSummary);
router.get('/patient-user-options', requirePermission(PERMISSION.REPORTS_VIEW), getPatientUserOptions);

router.get('/users', requirePermission(PERMISSION.ADMIN_MANAGE_USERS), getAllUsers);
router.get(
  '/users/:id/reviews',
  requirePermission(PERMISSION.ADMIN_MANAGE_REVIEWS),
  [
    param('id').isInt({ min: 1 }).withMessage('id must be a positive integer'),
    query('status')
      .optional()
      .isIn(['all', ...REVIEW_STATUSES])
      .withMessage('Invalid status filter'),
  ],
  validate,
  getPatientUserReviews
);
router.patch(
  '/users/:id',
  requirePermission(PERMISSION.ADMIN_MANAGE_USERS),
  [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('role').optional().isIn(['patient', 'doctor', 'admin']),
  ],
  validate,
  updateUser
);
router.delete('/users/:id', requirePermission(PERMISSION.ADMIN_MANAGE_USERS), deleteUser);

router.get(
  '/patients/:userId/financial-history',
  requirePermission(PERMISSION.REPORTS_VIEW),
  [param('userId').isInt({ min: 1 })],
  validate,
  getPatientFinancialHistory
);

router.delete(
  '/reviews/:reviewId',
  requirePermission(PERMISSION.ADMIN_MANAGE_REVIEWS),
  [param('reviewId').isInt({ min: 1 }).withMessage('reviewId must be a positive integer')],
  validate,
  deleteAdminReview
);

router.get('/doctors', requirePermission(PERMISSION.ADMIN_MANAGE_DOCTORS), getDoctorsList);
router.post(
  '/doctors',
  requirePermission(PERMISSION.ADMIN_MANAGE_DOCTORS),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('name').trim().notEmpty().withMessage('name is required'),
    body('specialization').optional().isString(),
  ],
  validate,
  createDoctorController
);
router.put(
  '/doctors/:id',
  requirePermission(PERMISSION.ADMIN_MANAGE_DOCTORS),
  [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('specialization').optional().isString(),
  ],
  validate,
  updateDoctorController
);
router.delete('/doctors/:id', requirePermission(PERMISSION.ADMIN_MANAGE_DOCTORS), deleteDoctorController);

router.get('/products', canViewProductsAdmin, getProducts);
router.get('/products/:id', canViewProductsAdmin, getProduct);
router.post(
  '/products',
  requirePermission(PERMISSION.PRODUCTS_CREATE),
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
          const parsed = parseInt(value, 10);
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
    body('lowStockThreshold').optional().isInt({ min: 0 }),
  ],
  validate,
  createProductController
);
router.put(
  '/products/:id',
  requirePermission(PERMISSION.PRODUCTS_EDIT),
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
          const parsed = parseInt(value, 10);
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
    body('lowStockThreshold').optional().isInt({ min: 0 }),
  ],
  validate,
  updateProductController
);
router.delete('/products/:id', requirePermission(PERMISSION.PRODUCTS_DELETE), deleteProductController);
router.post(
  '/products/:id/stock-adjustment',
  requirePermission(PERMISSION.INVENTORY_ADJUST),
  [
    param('id').isInt({ min: 1 }),
    body('delta')
      .isInt()
      .withMessage('delta must be an integer')
      .custom((value) => parseInt(value, 10) !== 0)
      .withMessage('delta must be non-zero'),
    body('reason').optional().isString().isLength({ max: 500 }),
  ],
  validate,
  adjustProductStockController
);

router.get('/orders', requirePermission(PERMISSION.ORDERS_VIEW_ALL), getAllOrdersController);
router.get(
  '/orders/:orderId',
  requirePermission(PERMISSION.ORDERS_VIEW_ALL),
  [param('orderId').isInt({ min: 1 })],
  validate,
  getAdminOrderByIdController
);
router.patch(
  '/orders/:orderId/status',
  requirePermission(PERMISSION.ORDERS_UPDATE_STATUS, PERMISSION.ORDERS_CANCEL),
  [
    param('orderId').isInt({ min: 1 }),
    body('status')
      .isIn(['pending', 'confirmed', 'cancelled'])
      .withMessage('Invalid status'),
  ],
  validate,
  updateOrderStatusController
);
router.patch(
  '/orders/:orderId/notes',
  requirePermission(PERMISSION.ORDERS_EDIT_NOTES),
  [
    param('orderId').isInt({ min: 1 }),
    body('adminNotes').optional({ nullable: true }).isString(),
  ],
  validate,
  patchAdminOrderNotesController
);
router.patch(
  '/orders/:orderId/payment-status',
  requirePermission(PERMISSION.ORDERS_EDIT_PAYMENT_STATUS),
  [
    param('orderId').isInt({ min: 1 }),
    body('paymentStatus').isIn(['unpaid', 'paid', 'failed', 'refunded']),
  ],
  validate,
  patchAdminOrderPaymentStatusController
);

module.exports = router;
