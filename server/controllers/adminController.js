const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.getDashboardStats = catchAsync(async (req, res) => {
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    revenueAgg,
    lowStockProducts,
    recentOrders,
    revenueByDay,
    topProducts,
    categoryBreakdown,
  ] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({ active: true }),
    Order.countDocuments(),
    Order.countDocuments({ status: { $in: ['Pending', 'Confirmed', 'Processing'] } }),
    Order.countDocuments({ status: 'Delivered' }),
    Order.countDocuments({ status: 'Cancelled' }),
    Order.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Product.find({ active: true, stock: { $lte: 5 } }).select('name stock sku').limit(10),
    Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(8),
    Order.aggregate([
      { $match: { paymentStatus: 'Paid', createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          unitsSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 5 },
    ]),
    Product.aggregate([
      { $match: { active: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { name: '$category.name', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      totals: {
        users: totalUsers,
        products: totalProducts,
        orders: totalOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        revenue: revenueAgg[0]?.total || 0,
      },
      lowStockProducts,
      recentOrders,
      revenueByDay,
      topProducts,
      categoryBreakdown,
    },
  });
});

exports.getUsers = catchAsync(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const filter = { role: 'customer' };
  if (search) {
    filter.$or = [
      { name: { $regex: escapeRegex(search), $options: 'i' } },
      { email: { $regex: escapeRegex(search), $options: 'i' } },
    ];
  }

  const requestedPage = Number(page);
  const requestedLimit = Number(limit);
  const pageNum = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1;
  const limitNum = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, Math.floor(requestedLimit))) : 20;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: users.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    data: { users },
  });
});

exports.getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return next(new AppError('User not found.', 404));

  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(20);
  res.status(200).json({ status: 'success', data: { user, orders } });
});

exports.setUserActiveStatus = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  if (user.role === 'admin') return next(new AppError('Cannot deactivate an admin account.', 403));

  user.isActive = req.body.isActive;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ status: 'success', data: { user: user.toSafeObject() } });
});
