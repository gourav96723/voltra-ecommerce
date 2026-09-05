const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { signToken, setAuthCookie, clearAuthCookie } = require('../utils/jwt');

const sendAuthResponse = (user, statusCode, res) => {
  const token = signToken(user._id, user.role);
  setAuthCookie(res, token);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user: user.toSafeObject() },
  });
};

exports.register = catchAsync(async (req, res, next) => {
  const { name, email, phone, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return next(new AppError('An account with this email already exists.', 409));

  const user = await User.create({ name, email, phone, password, role: 'customer' });
  sendAuthResponse(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }
  if (!user.isActive) {
    return next(new AppError('This account has been deactivated. Contact support.', 403));
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  sendAuthResponse(user, 200, res);
});

exports.logout = (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ status: 'success', message: 'Logged out.' });
};

exports.getMe = catchAsync(async (req, res) => {
  res.status(200).json({ status: 'success', data: { user: req.user.toSafeObject() } });
});

exports.updateProfile = catchAsync(async (req, res) => {
  const { name, phone } = req.body;
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  await req.user.save();
  res.status(200).json({ status: 'success', data: { user: req.user.toSafeObject() } });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect.', 401));
  }

  user.password = newPassword;
  await user.save();
  sendAuthResponse(user, 200, res);
});

// ---- Address management ----

exports.listAddresses = catchAsync(async (req, res) => {
  res.status(200).json({ status: 'success', data: { addresses: req.user.addresses } });
});

exports.addAddress = catchAsync(async (req, res) => {
  const address = req.body;
  if (address.isDefault || req.user.addresses.length === 0) {
    req.user.addresses.forEach((a) => (a.isDefault = false));
    address.isDefault = true;
  }
  req.user.addresses.push(address);
  await req.user.save();
  res.status(201).json({ status: 'success', data: { addresses: req.user.addresses } });
});

exports.updateAddress = catchAsync(async (req, res, next) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) return next(new AppError('Address not found.', 404));

  const wasDefault = address.isDefault;
  Object.assign(address, req.body);
  if (req.body.isDefault) {
    req.user.addresses.forEach((a) => {
      if (String(a._id) !== req.params.addressId) a.isDefault = false;
    });
  } else if (wasDefault && req.body.isDefault === false) {
    const fallback = req.user.addresses.find((a) => String(a._id) !== req.params.addressId);
    if (fallback) fallback.isDefault = true;
  }
  await req.user.save();
  res.status(200).json({ status: 'success', data: { addresses: req.user.addresses } });
});

exports.deleteAddress = catchAsync(async (req, res, next) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) return next(new AppError('Address not found.', 404));

  const wasDefault = address.isDefault;
  address.deleteOne();

  // Keep one default address whenever addresses remain.
  if (wasDefault && req.user.addresses.length > 0) {
    req.user.addresses[0].isDefault = true;
  }

  await req.user.save();
  res.status(200).json({ status: 'success', data: { addresses: req.user.addresses } });
});
