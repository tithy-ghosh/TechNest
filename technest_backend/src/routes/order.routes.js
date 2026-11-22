const router = require('express').Router();
const c = require('../controllers/order.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const validate = require('../validation/validate');
const {
  orderQuerySchema,
  orderStatusSchema,
  idParamSchema,
} = require('../validation/schemas');

router.get('/my-orders', protect, c.getMyOrders);
router.get('/', protect, adminOnly, validate({ query: orderQuerySchema }), c.getAllOrders);
router.patch(
  '/:id/status',
  protect,
  adminOnly,
  validate({ params: idParamSchema, body: orderStatusSchema }),
  c.updateOrderStatus
);
router.get('/:id', protect, validate({ params: idParamSchema }), c.getOrderById);

module.exports = router;
