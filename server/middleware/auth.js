const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

// Verifies the JWT (from httpOnly cookie or Authorization header) and attaches req.user.
// Never trusts a role sent from the client - always re-fetches the user from the DB.
const protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to continue.', 401));
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    return next(new AppError('Invalid or expired session. Please log in again.', 401));
  }

  const currentUser = await User.findById(decoded.sub);
  if (!currentUser) {
    return next(new AppError('The user belonging to this session no longer exists.', 401));
  }
  if (!currentUser.isActive) {
    return next(new AppError('This account has been deactivated.', 403));
  }

  req.user = currentUser;
  next();
});

// Optional auth: attaches req.user if a valid token is present, but never blocks the request.
const optionalAuth = catchAsync(async (req, res, next) => {
  let token;
  if (req.cookies?.token) token = req.cookies.token;
  else if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next();

  try {
    const decoded = verifyToken(token);
    const currentUser = await User.findById(decoded.sub);
    if (currentUser?.isActive) req.user = currentUser;
  } catch (err) {
    // ignore invalid token for optional auth
  }
  next();
});

// Role-based authorization. Always checks the DB-sourced req.user.role, never a client-supplied field.
const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };

module.exports = { protect, optionalAuth, restrictTo };
