const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const c = require('../controllers/user.controller');
const validate = require('../validation/validate');
const {
  userQuerySchema,
  productIdParamSchema,
  idParamSchema,
} = require('../validation/schemas');

router.get('/profile', protect, c.getProfile);

router.get(
  '/',
  protect,
  adminOnly,
  validate({ query: userQuerySchema }),
  c.getAllUsers
);

router.post(
  '/wishlist/:productId',
  protect,
  validate({ params: productIdParamSchema }),
  c.addToWishlist
);

router.delete(
  '/wishlist/:productId',
  protect,
  validate({ params: productIdParamSchema }),
  c.removeFromWishlist
);

router.get(
  '/:id',
  protect,
  adminOnly,
  validate({ params: idParamSchema }),
  c.getUserById
);

module.exports = router;
