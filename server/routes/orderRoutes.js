const express = require('express');
const orderController = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/auth');
const requireDb = require('../middleware/requireDb');
const validate = require('../middleware/validate');
const { createOrderSchema, updateOrderStatusSchema } = require('../validators/orderValidators');

const router = express.Router();

router.use(requireDb, protect);

router.post('/', validate(createOrderSchema), orderController.createOrder);
router.get('/my', orderController.getMyOrders);
router.get('/my/:id', orderController.getMyOrderById);
router.post('/my/:id/cancel', orderController.cancelMyOrder);
router.post('/:id/retry-payment', orderController.retryPayment);

// Admin
router.get('/admin/all', restrictTo('admin'), orderController.getAllOrdersAdmin);
router.get('/admin/:id', restrictTo('admin'), orderController.getOrderByIdAdmin);
router.patch(
  '/admin/:id/status',
  restrictTo('admin'),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatusAdmin
);

module.exports = router;
