const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { sendMessage } = require('../controllers/chat.controller');
const validate = require('../validation/validate');
const { chatSchema } = require('../validation/schemas');

const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Chat limit reached. Try again in an hour.',
  },
});

router.post('/message', chatLimiter, validate({ body: chatSchema }), sendMessage);

module.exports = router;
