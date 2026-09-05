const express = require('express');
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const requireDb = require('../middleware/requireDb');
const validate = require('../middleware/validate');
const { addToCartSchema, updateCartItemSchema } = require('../validators/orderValidators');

const router = express.Router();

router.use(requireDb, protect);

router.get('/', cartController.getCart);
router.post('/items', validate(addToCartSchema), cartController.addToCart);
router.patch('/items/:productId', validate(updateCartItemSchema), cartController.updateCartItem);
router.delete('/items/:productId', cartController.removeCartItem);
router.delete('/', cartController.clearCart);

module.exports = router;
