const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');
const requireDb = require('../middleware/requireDb');
const validate = require('../middleware/validate');
const { userStatusSchema } = require('../validators/authValidators');

const router = express.Router();

router.use(requireDb, protect, restrictTo('admin'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/status', validate(userStatusSchema), adminController.setUserActiveStatus);

module.exports = router;
