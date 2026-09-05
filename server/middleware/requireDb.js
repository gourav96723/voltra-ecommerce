const { isDbConnected } = require('../config/db');
const AppError = require('../utils/AppError');

module.exports = function requireDb(req, res, next) {
  if (!isDbConnected()) {
    return next(
      new AppError(
        'Database is not connected. Set MONGODB_URI in your .env and restart the server.',
        503
      )
    );
  }
  next();
};
