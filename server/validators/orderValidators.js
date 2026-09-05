const { z } = require('zod');

const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50).default(1),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(50),
});

const createOrderSchema = z.object({
  addressId: z.string().min(1, 'Shipping address is required'),
  paymentMethod: z.enum(['razorpay', 'cod']).default('razorpay'),
});

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  orderId: z.string().min(1),
});

const updateOrderStatusSchema = z.object({
  status: z.enum([
    'Pending',
    'Confirmed',
    'Processing',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Cancelled',
  ]),
  note: z.string().optional(),
});

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(1000),
});

module.exports = {
  addToCartSchema,
  updateCartItemSchema,
  createOrderSchema,
  verifyPaymentSchema,
  updateOrderStatusSchema,
  createReviewSchema,
};
