const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.getProductReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate('user', 'name')
    .sort({ createdAt: -1 });

  const distribution = [1, 2, 3, 4, 5].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews, distribution },
  });
});

exports.canReviewProduct = catchAsync(async (req, res) => {
  const alreadyReviewed = await Review.findOne({ product: req.params.productId, user: req.user._id });
  if (alreadyReviewed) {
    return res.status(200).json({ status: 'success', data: { canReview: false, reason: 'already-reviewed' } });
  }

  const deliveredOrder = await Order.findOne({
    user: req.user._id,
    status: 'Delivered',
    'items.product': req.params.productId,
  });

  res.status(200).json({
    status: 'success',
    data: {
      canReview: Boolean(deliveredOrder),
      reason: deliveredOrder ? null : 'not-purchased-or-not-delivered',
      orderId: deliveredOrder?._id,
    },
  });
});

async function recalculateProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const { avgRating = 0, count = 0 } = stats[0] || {};
  await Product.findByIdAndUpdate(productId, {
    rating: Math.round(avgRating * 10) / 10,
    reviewCount: count,
  });
}

exports.createReview = catchAsync(async (req, res, next) => {
  const { rating, comment } = req.body;
  const productId = req.params.productId;

  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) return next(new AppError('You have already reviewed this product.', 409));

  // Verified-purchase enforcement: must have a Delivered order containing this product.
  const deliveredOrder = await Order.findOne({
    user: req.user._id,
    status: 'Delivered',
    'items.product': productId,
  });
  if (!deliveredOrder) {
    return next(
      new AppError('Only customers who have received this product can leave a review.', 403)
    );
  }

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    order: deliveredOrder._id,
    rating,
    comment,
  });

  await recalculateProductRating(productId);

  res.status(201).json({ status: 'success', data: { review } });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
  if (!review) return next(new AppError('Review not found.', 404));

  const productId = review.product;
  await review.deleteOne();
  await recalculateProductRating(productId);

  res.status(200).json({ status: 'success', message: 'Review deleted.' });
});
