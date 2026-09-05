const Razorpay = require('razorpay');

const isRazorpayConfigured = Boolean(
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
);

let razorpayInstance = null;

if (isRazorpayConfigured) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn('[razorpay] Not configured. Payment endpoints will return 503 with a clear message until RAZORPAY_* env vars are set.');
}

module.exports = { razorpayInstance, isRazorpayConfigured };
