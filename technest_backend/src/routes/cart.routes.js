const router = require('express').Router();
const { getCart, addItem, applyCoupon } = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../validation/validate');
const { addItemSchema, applyCouponSchema } = require('../validation/schemas');

router.get('/', protect, getCart);
router.post('/add', protect, validate({ body: addItemSchema }), addItem);
router.post('/coupon', protect, validate({ body: applyCouponSchema }), applyCoupon);

module.exports = router;
