const Category = require('../models/Category');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.getCategories = catchAsync(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.status(200).json({ status: 'success', results: categories.length, data: { categories } });
});

exports.getAllCategoriesAdmin = catchAsync(async (req, res) => {
  const categories = await Category.find({}).sort({ name: 1 });
  res.status(200).json({ status: 'success', results: categories.length, data: { categories } });
});

exports.getCategoryBySlug = catchAsync(async (req, res, next) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true });
  if (!category) return next(new AppError('Category not found.', 404));
  res.status(200).json({ status: 'success', data: { category } });
});

exports.createCategory = catchAsync(async (req, res, next) => {
  const existing = await Category.findOne({ name: req.body.name });
  if (existing) return next(new AppError('A category with this name already exists.', 409));

  const category = await Category.create(req.body);
  res.status(201).json({ status: 'success', data: { category } });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) return next(new AppError('Category not found.', 404));
  res.status(200).json({ status: 'success', data: { category } });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const inUse = await Product.countDocuments({ category: req.params.id, active: true });
  if (inUse > 0) {
    return next(
      new AppError(
        `Cannot delete: ${inUse} active product(s) use this category. Deactivate it instead.`,
        409
      )
    );
  }
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!category) return next(new AppError('Category not found.', 404));
  res.status(200).json({ status: 'success', message: 'Category deactivated.', data: { category } });
});
