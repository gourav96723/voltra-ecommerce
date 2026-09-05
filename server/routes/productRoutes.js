const express = require('express');
const productController = require('../controllers/productController');
const { protect, restrictTo } = require('../middleware/auth');
const requireDb = require('../middleware/requireDb');
const validate = require('../middleware/validate');
const { createProductSchema, updateProductSchema } = require('../validators/productValidators');

const router = express.Router();

router.use(requireDb);

// Admin routes must be declared before /:slug so paths such as
// /admin/all are not accidentally captured as a public product slug.
router.get('/admin/all', protect, restrictTo('admin'), productController.getProductsAdmin);
router.get('/admin/:id', protect, restrictTo('admin'), productController.getProductByIdAdmin);
router.post('/', protect, restrictTo('admin'), validate(createProductSchema), productController.createProduct);
router.patch('/:id', protect, restrictTo('admin'), validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', protect, restrictTo('admin'), productController.deleteProduct);

// Public
router.get('/', productController.getProducts);
router.get('/meta/brands', productController.getBrands);
router.get('/:slug', productController.getProductBySlug);

module.exports = router;
