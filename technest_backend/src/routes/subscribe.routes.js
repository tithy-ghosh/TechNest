const express = require('express');
const router = express.Router();
const {
  subscribe,
  confirmSubscription,
  unsubscribe,
} = require('../controllers/subscribe.controller');
const validate = require('../validation/validate');
const { subscribeSchema, tokenQuerySchema } = require('../validation/schemas');

router.post('/', validate({ body: subscribeSchema }), subscribe);
router.get('/confirm', validate({ query: tokenQuerySchema }), confirmSubscription);
router.get('/unsubscribe', validate({ query: tokenQuerySchema }), unsubscribe);

module.exports = router;
