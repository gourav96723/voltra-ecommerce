const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const requireDb = require('../middleware/requireDb');
const validate = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  addressSchema,
} = require('../validators/authValidators');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { status: 'fail', message: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(requireDb);

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);

router.use(protect);

router.get('/me', authController.getMe);
router.patch('/profile', validate(updateProfileSchema), authController.updateProfile);
router.patch('/change-password', validate(changePasswordSchema), authController.changePassword);

router
  .route('/addresses')
  .get(authController.listAddresses)
  .post(validate(addressSchema), authController.addAddress);

router
  .route('/addresses/:addressId')
  .patch(validate(addressSchema.partial()), authController.updateAddress)
  .delete(authController.deleteAddress);

module.exports = router;
