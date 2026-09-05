const Product = require('../models/Product');
const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// GET /api/products - list with search, filter, sort, pagination
exports.getProducts = catchAsync(async (req, res) => {
  const {
    search,
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    minDiscount,
    sort,
    page = 1,
    limit = 12,
    featured,
  } = req.query;

  const filter = { active: true };

  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (brand) filter.brand = { $in: brand.split(',') };
  if (minRating) {
    const value = Number(minRating);
    if (Number.isFinite(value) && value >= 0 && value <= 5) filter.rating = { $gte: value };
  }
  if (inStock === 'true') filter.stock = { $gt: 0 };
  if (featured === 'true') filter.featured = true;
  if (minDiscount) {
    const value = Number(minDiscount);
    if (Number.isFinite(value) && value >= 0 && value <= 90) filter.discountPercentage = { $gte: value };
  }

  if (minPrice || maxPrice) {
    const min = minPrice === undefined || minPrice === '' ? null : Number(minPrice);
    const max = maxPrice === undefined || maxPrice === '' ? null : Number(maxPrice);
    filter.price = {};
    if (Number.isFinite(min) && min >= 0) filter.price.$gte = min;
    if (Number.isFinite(max) && max >= 0) filter.price.$lte = max;
    if (Object.keys(filter.price).length === 0) delete filter.price;
  }

  const sortMap = {
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    newest: { createdAt: -1 },
    'rating-desc': { rating: -1 },
    popular: { reviewCount: -1 },
    'discount-desc': { discountPercentage: -1 },
  };
  const sortBy = sortMap[sort] || { createdAt: -1 };

  const requestedPage = Number(page);
  const requestedLimit = Number(limit);
  const pageNum = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1;
  const limitNum = Number.isFinite(requestedLimit) ? Math.min(60, Math.max(1, Math.floor(requestedLimit))) : 12;
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort(sortBy).skip(skip).limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: products.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    data: { products },
  });
});

// GET /api/products/:slug
exports.getProductBySlug = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug, active: true }).populate(
    'category',
    'name slug'
  );
  if (!product) return next(new AppError('Product not found.', 404));

  const related = await Product.find({
    category: product.category?._id || product.category,
    _id: { $ne: product._id },
    active: true,
  })
    .limit(8)
    .select('name slug price discountPercentage images rating reviewCount stock brand');

  res.status(200).json({ status: 'success', data: { product, related } });
});

// GET /api/products/meta/brands
exports.getBrands = catchAsync(async (req, res) => {
  const brands = await Product.distinct('brand', { active: true });
  res.status(200).json({ status: 'success', data: { brands } });
});

// ---- Admin ----

exports.getProductByIdAdmin = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) return next(new AppError('Product not found.', 404));
  res.status(200).json({ status: 'success', data: { product } });
});

exports.getProductsAdmin = catchAsync(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (search) filter.$text = { $search: search };

  const requestedPage = Number(page);
  const requestedLimit = Number(limit);
  const pageNum = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1;
  const limitNum = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, Math.floor(requestedLimit))) : 20;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: products.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    data: { products },
  });
});

exports.createProduct = catchAsync(async (req, res, next) => {
  const category = await Category.findOne({ _id: req.body.category, isActive: true });
  if (!category) return next(new AppError('Active category not found.', 404));

  const product = await Product.create(req.body);
  res.status(201).json({ status: 'success', data: { product } });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  if (req.body.category) {
    const category = await Category.findOne({ _id: req.body.category, isActive: true });
    if (!category) return next(new AppError('Active category not found.', 404));
  }

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) return next(new AppError('Product not found.', 404));
  res.status(200).json({ status: 'success', data: { product } });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  // Soft delete: deactivate rather than hard-remove, so historical orders keep valid references.
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { active: false },
    { new: true }
  );
  if (!product) return next(new AppError('Product not found.', 404));
  res.status(200).json({ status: 'success', message: 'Product deactivated.', data: { product } });
});
