const router = require('express').Router();
const c = require('../controllers/coupon.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const validate = require('../validation/validate');
const {
  couponCreateSchema,
  couponUpdateSchema,
  validateCouponSchema,
  idParamSchema,
} = require('../validation/schemas');

router.post(
  '/validate',
  protect,
  validate({ body: validateCouponSchema }),
  c.validateCoupon
);
router.get('/', protect, adminOnly, c.getAllCoupons);
router.post(
  '/',
  protect,
  adminOnly,
  validate({ body: couponCreateSchema }),
  c.createCoupon
);
router.patch(
  '/:id',
  protect,
  adminOnly,
  validate({ params: idParamSchema, body: couponUpdateSchema }),
  c.updateCoupon
);
router.delete(
  '/:id',
  protect,
  adminOnly,
  validate({ params: idParamSchema }),
  c.deleteCoupon
);

module.exports = router;
