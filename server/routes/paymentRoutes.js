const express = require('express');
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const requireDb = require('../middleware/requireDb');
const validate = require('../middleware/validate');
const { verifyPaymentSchema } = require('../validators/orderValidators');
const { isRazorpayConfigured } = require('../config/razorpay');

const router = express.Router();

// Public, non-sensitive configuration status used by checkout to show whether
// online payment is currently available. Never expose the Razorpay secret.
router.get('/config', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { onlinePaymentAvailable: isRazorpayConfigured },
  });
});

router.use(requireDb, protect);

router.post('/verify', validate(verifyPaymentSchema), orderController.verifyPayment);
router.post('/failed', orderController.paymentFailed);

module.exports = router;
