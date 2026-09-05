const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, products: [] });
  return wishlist;
};

exports.getWishlist = catchAsync(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  await wishlist.populate({
    path: 'products',
    match: { active: true },
    select: 'name slug price discountPercentage images rating reviewCount stock brand',
  });
  res.status(200).json({ status: 'success', results: wishlist.products.length, data: { products: wishlist.products } });
});

exports.addToWishlist = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ _id: req.params.productId, active: true });
  if (!product) return next(new AppError('Product not found.', 404));

  const wishlist = await getOrCreateWishlist(req.user._id);
  if (!wishlist.products.some((p) => String(p) === req.params.productId)) {
    wishlist.products.push(req.params.productId);
    await wishlist.save();
  }
  res.status(200).json({ status: 'success', message: 'Added to wishlist.', data: { productIds: wishlist.products } });
});

exports.removeFromWishlist = catchAsync(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  wishlist.products = wishlist.products.filter((p) => String(p) !== req.params.productId);
  await wishlist.save();
  res.status(200).json({ status: 'success', message: 'Removed from wishlist.', data: { productIds: wishlist.products } });
});

exports.moveToCart = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ _id: req.params.productId, active: true });
  if (!product) return next(new AppError('Product not found.', 404));
  if (product.stock < 1) return next(new AppError('This product is out of stock.', 409));

  const wishlist = await getOrCreateWishlist(req.user._id);

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  const existing = cart.items.find((i) => String(i.product) === req.params.productId);
  const desiredQty = (existing?.quantity || 0) + 1;

  if (desiredQty > product.stock) {
    return next(new AppError(`Only ${product.stock} unit(s) available in stock.`, 409));
  }

  wishlist.products = wishlist.products.filter((p) => String(p) !== req.params.productId);
  await wishlist.save();

  if (existing) existing.quantity = desiredQty;
  else cart.items.push({ product: req.params.productId, quantity: 1 });
  await cart.save();

  res.status(200).json({ status: 'success', message: 'Moved to cart.' });
});
