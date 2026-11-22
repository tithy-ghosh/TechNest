const router = require('express').Router();
const { createIntent } = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../validation/validate');
const { createIntentSchema } = require('../validation/schemas');

router.post('/intent', protect, validate({ body: createIntentSchema }), createIntent);

module.exports = router;
