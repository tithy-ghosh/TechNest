const router = require('express').Router();
const {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../validation/validate');
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validation/schemas');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

router.post('/register', limiter, validate({ body: registerSchema }), register);
router.post('/login', limiter, validate({ body: loginSchema }), login);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.get('/verify-email', validate({ query: verifyEmailSchema }), verifyEmail);
router.post(
  '/forgot-password',
  limiter,
  validate({ body: forgotPasswordSchema }),
  forgotPassword
);
router.post(
  '/reset-password',
  validate({ body: resetPasswordSchema }),
  resetPassword
);

module.exports = router;
