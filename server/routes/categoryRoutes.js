const express = require('express');
const categoryController = require('../controllers/categoryController');
const { protect, restrictTo } = require('../middleware/auth');
const requireDb = require('../middleware/requireDb');
const validate = require('../middleware/validate');
const { createCategorySchema, updateCategorySchema } = require('../validators/productValidators');

const router = express.Router();

router.use(requireDb);

router.get('/', categoryController.getCategories);
router.get('/admin/all', protect, restrictTo('admin'), categoryController.getAllCategoriesAdmin);
router.get('/:slug', categoryController.getCategoryBySlug);

router.use(protect, restrictTo('admin'));
router.post('/', validate(createCategorySchema), categoryController.createCategory);
router.patch('/:id', validate(updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
