const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');
const validate = require('../validation/validate');
const {
  revenueQuerySchema,
  topProductsQuerySchema,
} = require('../validation/schemas');

router.use(protect, adminOnly);

router.get('/dashboard/kpi', adminController.getDashboardKPI);
router.get(
  '/dashboard/revenue',
  validate({ query: revenueQuerySchema }),
  adminController.getRevenueTrends
);
router.get('/dashboard/orders', adminController.getOrderStats);
router.get(
  '/dashboard/top-products',
  validate({ query: topProductsQuerySchema }),
  adminController.getTopProducts
);
router.get('/dashboard/category-revenue', adminController.getRevenueByCategory);
router.get('/dashboard/users', adminController.getUserStats);
router.get('/dashboard/abandoned-carts', adminController.getAbandonedCarts);
router.get('/dashboard/coupons', adminController.getCouponStats);

module.exports = router;
