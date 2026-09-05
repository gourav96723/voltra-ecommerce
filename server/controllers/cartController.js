const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 79;
const TAX_RATE = 0.05; // 5% - illustrative, server-computed, never trusted from client

// Builds a cart response with server-computed pricing. Never trusts any total from the client.
async function buildCartSummary(cart) {
  const populated = await cart.populate('items.product');
  const items = [];
  let subtotal = 0;
  let discount = 0;

  for (const item of populated.items) {
    const p = item.product;
    if (!p || !p.active) continue; // skip products that were removed/deactivated
    const lineOriginal = p.price * item.quantity;
    const lineDiscounted = p.discountPrice * item.quantity;
    subtotal += lineOriginal;
    discount += lineOriginal - lineDiscounted;
    items.push({
      product: p,
      quantity: item.quantity,
      lineTotal: Math.round(lineDiscounted * 100) / 100,
      exceedsStock: item.quantity > p.stock,
    });
  }

  const afterDiscount = subtotal - discount;
  const shippingFee = afterDiscount === 0 || afterDiscount >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const tax = Math.round(afterDiscount * TAX_RATE * 100) / 100;
  const total = Math.round((afterDiscount + shippingFee + tax) * 100) / 100;

  return {
    items,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    shippingFee,
    tax,
    total,
  };
}

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

exports.getCart = catchAsync(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const summary = await buildCartSummary(cart);
  res.status(200).json({ status: 'success', data: summary });
});

exports.addToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity } = req.body;

  const product = await Product.findOne({ _id: productId, active: true });
  if (!product) return next(new AppError('Product not found.', 404));
  if (product.stock < 1) return next(new AppError('This product is out of stock.', 409));

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((i) => String(i.product) === productId);

  const desiredQty = (existing ? existing.quantity : 0) + quantity;
  if (desiredQty > product.stock) {
    return next(new AppError(`Only ${product.stock} unit(s) available in stock.`, 409));
  }

  if (existing) existing.quantity = desiredQty;
  else cart.items.push({ product: productId, quantity });

  await cart.save();
  const summary = await buildCartSummary(cart);
  res.status(200).json({ status: 'success', data: summary });
});

exports.updateCartItem = catchAsync(async (req, res, next) => {
  const { quantity } = req.body;
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => String(i.product) === req.params.productId);
  if (!item) return next(new AppError('Item not in cart.', 404));

  const product = await Product.findById(item.product);
  if (!product) return next(new AppError('Product not found.', 404));
  if (quantity > product.stock) {
    return next(new AppError(`Only ${product.stock} unit(s) available in stock.`, 409));
  }

  item.quantity = quantity;
  await cart.save();
  const summary = await buildCartSummary(cart);
  res.status(200).json({ status: 'success', data: summary });
});

exports.removeCartItem = catchAsync(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((i) => String(i.product) !== req.params.productId);
  await cart.save();
  const summary = await buildCartSummary(cart);
  res.status(200).json({ status: 'success', data: summary });
});

exports.clearCart = catchAsync(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.status(200).json({ status: 'success', data: { items: [], itemCount: 0, subtotal: 0, discount: 0, shippingFee: 0, tax: 0, total: 0 } });
});

exports.buildCartSummary = buildCartSummary;
exports.getOrCreateCart = getOrCreateCart;
exports.SHIPPING_THRESHOLD = SHIPPING_THRESHOLD;
exports.SHIPPING_FEE = SHIPPING_FEE;
exports.TAX_RATE = TAX_RATE;
