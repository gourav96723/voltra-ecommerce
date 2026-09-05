const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { generateOrderNumber } = require('../utils/generateIds');
const { buildCartSummary, getOrCreateCart } = require('./cartController');
const { razorpayInstance, isRazorpayConfigured } = require('../config/razorpay');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toPaise = (rupees) => Math.round(Number(rupees) * 100);

const safeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf);
};

const refundPaidOrder = async (order) => {
  if (!order.razorpayPaymentId) {
    throw new AppError('This paid order has no Razorpay payment ID. Manual refund is required.', 502);
  }
  if (!isRazorpayConfigured) {
    throw new AppError('Razorpay is not configured. The order cannot be refunded automatically.', 503);
  }

  return razorpayInstance.payments.refund(order.razorpayPaymentId, {
    amount: toPaise(order.total),
    notes: { orderNumber: order.orderNumber },
  });
};


// Creates a Pending order from the user's current cart + selected address.
// Stock is validated but NOT decremented yet - it is only decremented on confirmed payment
// (see verifyPayment / COD path), so a failed/abandoned payment never locks up inventory.
exports.createOrder = catchAsync(async (req, res, next) => {
  const { addressId, paymentMethod } = req.body;

  // Do not create an orphan pending order when online payment is unavailable.
  // The checkout UI may still show the exact final amount, but Razorpay must be
  // configured before an online order is persisted. COD remains independent.
  if (paymentMethod === 'razorpay' && !isRazorpayConfigured) {
    return next(
      new AppError(
        'Online payment is not configured yet. Choose Cash on Delivery or configure Razorpay credentials.',
        503
      )
    );
  }

  const address = req.user.addresses.id(addressId);
  if (!address) return next(new AppError('Shipping address not found.', 404));

  const cart = await getOrCreateCart(req.user._id);
  if (cart.items.length === 0) return next(new AppError('Your cart is empty.', 400));

  const summary = await buildCartSummary(cart);
  if (summary.items.length === 0) return next(new AppError('Your cart is empty.', 400));

  const outOfStock = summary.items.filter((i) => i.exceedsStock);
  if (outOfStock.length > 0) {
    return next(
      new AppError(
        `Not enough stock for: ${outOfStock.map((i) => i.product.name).join(', ')}.`,
        409
      )
    );
  }

  const orderItems = summary.items.map((i) => ({
    product: i.product._id,
    name: i.product.name,
    image: i.product.images?.[0]?.url || '',
    sku: i.product.sku,
    price: i.product.discountPrice,
    quantity: i.quantity,
  }));

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: req.user._id,
    items: orderItems,
    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    },
    subtotal: summary.subtotal,
    discount: summary.discount,
    shippingFee: summary.shippingFee,
    tax: summary.tax,
    total: summary.total,
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? 'Pending' : 'Pending',
    status: 'Pending',
    statusHistory: [{ status: 'Pending', note: 'Order created, awaiting payment.' }],
  });

  if (paymentMethod === 'cod') {
    try {
      await decrementStockForOrder(order);
      order.stockDeducted = true;
    } catch (err) {
      await order.deleteOne();
      return next(err);
    }
    order.status = 'Confirmed';
    order.statusHistory.push({ status: 'Confirmed', note: 'Cash on delivery order confirmed.' });
    await order.save();
    cart.items = [];
    await cart.save();
    return res.status(201).json({ status: 'success', data: { order } });
  }

  const razorpayOrder = await razorpayInstance.orders.create({
    amount: Math.round(order.total * 100), // paise
    currency: 'INR',
    receipt: order.orderNumber,
  });

  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  res.status(201).json({
    status: 'success',
    data: {
      order,
      razorpay: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    },
  });
});

async function decrementStockForOrder(order) {
  // Each update is atomic and conditional, so stock can never become negative.
  // If a later line fails, compensate the earlier successful decrements so a
  // multi-item order does not leave inventory partially reduced.
  const decremented = [];
  try {
    for (const item of order.items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, active: true, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) {
        throw new AppError(`Insufficient stock for "${item.name}" at time of payment confirmation.`, 409);
      }
      decremented.push(item);
    }
  } catch (err) {
    await Promise.all(
      decremented.map((item) =>
        Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
      )
    );
    throw err;
  }
}

async function restoreStockForOrder(order) {
  await Promise.all(
    order.items.map((item) =>
      Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
    )
  );
}

// POST /api/payments/verify
exports.verifyPayment = catchAsync(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  if (!isRazorpayConfigured) {
    return next(new AppError('Payment gateway is not configured.', 503));
  }

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) return next(new AppError('Order not found.', 404));
  if (order.paymentMethod !== 'razorpay') {
    return next(new AppError('This order does not use online payment.', 409));
  }
  if (order.razorpayOrderId !== razorpay_order_id) {
    return next(new AppError('The Razorpay order does not match this order.', 400));
  }
  if (order.paymentStatus === 'Paid') {
    return res.status(200).json({ status: 'success', message: 'Payment already verified.', data: { order } });
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (!safeEqual(expectedSignature, razorpay_signature)) {
    order.paymentStatus = 'Failed';
    order.statusHistory.push({ status: 'Pending', note: 'Payment signature verification failed.' });
    await order.save();
    return next(new AppError('Payment verification failed. Please contact support if your bank or wallet was charged.', 400));
  }

  // Signature verification proves the callback is authentic, but we also verify
  // the Razorpay payment belongs to the expected order and exact server total.
  // This prevents a valid callback for a different amount/order being accepted.
  let razorpayPayment;
  try {
    razorpayPayment = await razorpayInstance.payments.fetch(razorpay_payment_id);
  } catch (err) {
    return next(new AppError('Unable to verify the payment with Razorpay right now. Please retry.', 502));
  }

  if (razorpayPayment.order_id !== razorpay_order_id) {
    return next(new AppError('The Razorpay payment does not belong to this order.', 400));
  }

  const expectedAmount = toPaise(order.total);
  if (Number(razorpayPayment.amount) !== expectedAmount || razorpayPayment.currency !== 'INR') {
    return next(new AppError('The payment amount does not match the order total.', 400));
  }

  if (razorpayPayment.status !== 'captured') {
    return next(new AppError(`Payment is not captured yet (status: ${razorpayPayment.status}). Please retry or check the payment status.`, 409));
  }

  // Claim this payment verification once. This prevents duplicate browser
  // callbacks/retries from decrementing stock twice for the same payment.
  const verificationCutoff = new Date(Date.now() - 5 * 60 * 1000);
  const claimedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      user: req.user._id,
      paymentStatus: { $ne: 'Paid' },
      $or: [
        { razorpayPaymentId: { $exists: false } },
        { razorpayPaymentId: null },
        { paymentVerificationStartedAt: { $lt: verificationCutoff } },
      ],
    },
    {
      $set: {
        razorpayPaymentId: razorpay_payment_id,
        paymentVerificationStartedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!claimedOrder) {
    const latestOrder = await Order.findById(order._id);
    if (latestOrder?.paymentStatus === 'Paid') {
      return res.status(200).json({
        status: 'success',
        message: 'Payment already verified.',
        data: { order: latestOrder },
      });
    }
    return next(new AppError('Payment verification is already being processed. Please check your order status shortly.', 409));
  }

  order.razorpayPaymentId = claimedOrder.razorpayPaymentId;
  order.paymentVerificationStartedAt = claimedOrder.paymentVerificationStartedAt;

  try {
    await decrementStockForOrder(order);
  } catch (err) {
    // The payment signature is valid, so a captured payment must not be left
    // without an order outcome if inventory was consumed by another checkout.
    try {
      await refundPaidOrder({ ...order.toObject(), razorpayPaymentId: razorpay_payment_id });
    } catch (refundErr) {
      order.paymentStatus = 'Paid';
      order.status = 'Pending';
      order.razorpayPaymentId = razorpay_payment_id;
      order.razorpaySignature = razorpay_signature;
      order.paymentVerificationStartedAt = undefined;
      order.statusHistory.push({
        status: 'Pending',
        note: `Payment captured but inventory was unavailable. Automatic refund failed: ${refundErr.message}`,
      });
      await order.save();
      return next(new AppError('Payment was captured but inventory became unavailable. An automatic refund could not be completed; please contact support.', 502));
    }

    order.paymentStatus = 'Refunded';
    order.status = 'Cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = 'Payment captured but inventory became unavailable; payment refunded.';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.statusHistory.push({ status: 'Cancelled', note: order.cancelReason });
    await order.save();
    return next(new AppError('The product sold out while your payment was processing. Your payment has been refunded.', 409));
  }

  order.stockDeducted = true;
  order.paymentStatus = 'Paid';
  order.status = 'Confirmed';
  order.razorpayPaymentId = razorpay_payment_id;
  order.razorpaySignature = razorpay_signature;
  order.paymentVerificationStartedAt = undefined;
  order.statusHistory.push({ status: 'Confirmed', note: 'Payment verified and order confirmed.' });
  await order.save();

  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }

  res.status(200).json({ status: 'success', data: { order } });
});

exports.paymentFailed = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.body.orderId, user: req.user._id });
  if (!order) return next(new AppError('Order not found.', 404));
  if (order.paymentMethod !== 'razorpay') return next(new AppError('This order does not use online payment.', 409));
  if (order.paymentStatus === 'Paid') {
    return res.status(200).json({ status: 'success', message: 'Payment is already marked as paid.', data: { order } });
  }
  if (order.status === 'Cancelled') {
    return next(new AppError('This order has already been cancelled.', 409));
  }

  order.paymentStatus = 'Failed';
  order.statusHistory.push({ status: 'Pending', note: 'Payment failed or was cancelled by user.' });
  await order.save();

  res.status(200).json({ status: 'success', message: 'Payment marked as failed. You can retry from Order History.', data: { order } });
});

// POST /api/orders/:id/retry-payment - creates a fresh razorpay order for a Pending/Failed order
exports.retryPayment = catchAsync(async (req, res, next) => {
  if (!isRazorpayConfigured) return next(new AppError('Payment gateway is not configured.', 503));

  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return next(new AppError('Order not found.', 404));
  if (order.paymentStatus === 'Paid') return next(new AppError('This order is already paid.', 409));
  if (order.status === 'Cancelled') return next(new AppError('This order was cancelled.', 409));

  const razorpayOrder = await razorpayInstance.orders.create({
    amount: Math.round(order.total * 100),
    currency: 'INR',
    receipt: `${order.orderNumber}-retry-${Date.now()}`,
  });

  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  res.status(200).json({
    status: 'success',
    data: {
      order,
      razorpay: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    },
  });
});

// ---- Customer order views ----

exports.getMyOrders = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const requestedPage = Number(page);
  const requestedLimit = Number(limit);
  const pageNum = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1;
  const limitNum = Number.isFinite(requestedLimit) ? Math.min(50, Math.max(1, Math.floor(requestedLimit))) : 10;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Order.countDocuments({ user: req.user._id }),
  ]);

  res.status(200).json({
    status: 'success',
    results: orders.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    data: { orders },
  });
});

exports.getMyOrderById = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate(
    'items.product',
    'slug'
  );
  if (!order) return next(new AppError('Order not found.', 404));
  res.status(200).json({ status: 'success', data: { order } });
});

exports.cancelMyOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return next(new AppError('Order not found.', 404));

  if (['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(order.status)) {
    return next(new AppError(`Order cannot be cancelled once it is ${order.status}.`, 409));
  }

  // A paid Razorpay order must be refunded before it is cancelled. COD orders
  // have no captured payment yet, so they only need a status change.
  if (order.paymentStatus === 'Paid' && order.paymentMethod === 'razorpay') {
    try {
      await refundPaidOrder(order);
    } catch (err) {
      return next(err);
    }
  }

  if (order.stockDeducted) {
    try {
      await restoreStockForOrder(order);
      order.stockDeducted = false;
    } catch (err) {
      return next(new AppError('The order could not be cancelled safely because inventory restoration failed. Please contact support.', 503));
    }
  }

  if (order.paymentStatus === 'Paid' && order.paymentMethod === 'razorpay') {
    order.paymentStatus = 'Refunded';
  }

  order.status = 'Cancelled';
  order.cancelledAt = new Date();
  order.cancelReason = req.body.reason || 'Cancelled by customer';
  order.statusHistory.push({ status: 'Cancelled', note: order.cancelReason });
  await order.save();

  res.status(200).json({ status: 'success', data: { order } });
});

// ---- Admin order views ----

exports.getAllOrdersAdmin = catchAsync(async (req, res) => {
  const { status, paymentStatus, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (search) filter.orderNumber = { $regex: escapeRegex(search), $options: 'i' };

  const requestedPage = Number(page);
  const requestedLimit = Number(limit);
  const pageNum = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1;
  const limitNum = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, Math.floor(requestedLimit))) : 20;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: orders.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    data: { orders },
  });
});

exports.getOrderByIdAdmin = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) return next(new AppError('Order not found.', 404));
  res.status(200).json({ status: 'success', data: { order } });
});

exports.updateOrderStatusAdmin = catchAsync(async (req, res, next) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('Order not found.', 404));

  const allowedTransitions = {
    Pending: ['Confirmed', 'Cancelled'],
    Confirmed: ['Processing', 'Cancelled'],
    Processing: ['Shipped', 'Cancelled'],
    Shipped: ['Out for Delivery'],
    'Out for Delivery': ['Delivered'],
    Delivered: [],
    Cancelled: [],
  };

  if (status === order.status) {
    return next(new AppError(`Order is already ${status}.`, 409));
  }

  if (!allowedTransitions[order.status]?.includes(status)) {
    return next(new AppError(`Cannot move an order from ${order.status} to ${status}.`, 409));
  }

  if (status === 'Cancelled' && order.paymentStatus === 'Paid') {
    if (order.paymentMethod !== 'razorpay') {
      return next(new AppError('A COD order should not be marked as paid before delivery.', 409));
    }
    try {
      await refundPaidOrder(order);
    } catch (err) {
      return next(err);
    }

    if (order.stockDeducted) {
      try {
        await restoreStockForOrder(order);
        order.stockDeducted = false;
      } catch (err) {
        return next(new AppError('The order could not be cancelled safely because inventory restoration failed. Please contact support.', 503));
      }
    }
    order.paymentStatus = 'Refunded';
    order.cancelledAt = new Date();
    order.cancelReason = note || 'Cancelled by admin';
  }

  if (status === 'Cancelled' && order.paymentStatus !== 'Paid' && order.stockDeducted) {
    try {
      await restoreStockForOrder(order);
      order.stockDeducted = false;
    } catch (err) {
      return next(new AppError('The order could not be cancelled safely because inventory restoration failed. Please contact support.', 503));
    }
    order.cancelledAt = new Date();
    order.cancelReason = note || 'Cancelled by admin';
  }

  if (status === 'Delivered' && order.paymentMethod === 'cod' && order.paymentStatus === 'Pending') {
    order.paymentStatus = 'Paid';
  }

  order.status = status;
  order.statusHistory.push({ status, note: note || '' });
  await order.save();

  res.status(200).json({ status: 'success', data: { order } });
});

exports.decrementStockForOrder = decrementStockForOrder;
