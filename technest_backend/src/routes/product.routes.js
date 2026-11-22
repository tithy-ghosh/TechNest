const router = require('express').Router();
const c = require('../controllers/product.controller');
const reviewController = require('../controllers/review.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { uploadImages } = require('../middleware/upload.middleware');
const { prisma } = require('../config/db');
const jwt = require('jsonwebtoken');
const validate = require('../validation/validate');
const {
  productCreateSchema,
  productUpdateSchema,
  productQuerySchema,
  idParamSchema,
  slugParamSchema,
  reviewParamsSchema,
  createReviewSchema,
} = require('../validation/schemas');

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (!err && decoded) {
      try {
        req.user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, role: true },
        });
      } catch (error) {
        console.error('[optionalAuth]', error.message);
      }
    }
    next();
  });
};

router.get('/', optionalAuth, validate({ query: productQuerySchema }), c.getProducts);
router.get('/featured', c.getFeaturedProducts);
router.get(
  '/id/:id',
  protect,
  adminOnly,
  validate({ params: idParamSchema }),
  c.getProductById
);
router.post(
  '/',
  protect,
  adminOnly,
  validate({ body: productCreateSchema }),
  c.createProduct
);
router.patch(
  '/:id',
  protect,
  adminOnly,
  validate({ params: idParamSchema, body: productUpdateSchema }),
  c.updateProduct
);
router.delete(
  '/:id',
  protect,
  adminOnly,
  validate({ params: idParamSchema }),
  c.deleteProduct
);
router.post(
  '/:id/images',
  protect,
  adminOnly,
  validate({ params: idParamSchema }),
  uploadImages,
  c.uploadProductImages
);

router.get(
  '/:slug/reviews',
  validate({ params: slugParamSchema }),
  reviewController.getReviews
);
router.post(
  '/:slug/reviews',
  protect,
  validate({ params: slugParamSchema, body: createReviewSchema }),
  reviewController.createReview
);
router.delete(
  '/:slug/reviews/:reviewId',
  protect,
  validate({ params: reviewParamsSchema }),
  reviewController.deleteReview
);

router.get(
  '/:slug',
  optionalAuth,
  validate({ params: slugParamSchema }),
  c.getProductBySlug
);

module.exports = router;
