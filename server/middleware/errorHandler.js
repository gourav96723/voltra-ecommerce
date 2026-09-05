const AppError = require('../utils/AppError');

const handleCastError = (err) => new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFieldError = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue?.[field];
  return new AppError(`${field} '${value}' already exists. Please use a different value.`, 409);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Invalid input: ${messages.join('. ')}`, 422);
};

const handleJWTError = () => new AppError('Invalid session. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Your session has expired. Please log in again.', 401);

// eslint-disable-next-line no-unused-vars
module.exports = function globalErrorHandler(err, req, res, next) {
  let error = err;
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (error.name === 'CastError') error = handleCastError(error);
  if (error.code === 11000) error = handleDuplicateFieldError(error);
  if (error.name === 'ValidationError') error = handleValidationError(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  const isProd = process.env.NODE_ENV === 'production';

  if (!error.isOperational && !isProd) {
    // Unexpected programming error in dev - log full detail
    console.error('UNEXPECTED ERROR 💥', error);
  } else if (!error.isOperational) {
    console.error('UNEXPECTED ERROR 💥', error.message);
  }

  const statusCode = error.isOperational ? error.statusCode : 500;
  const message = error.isOperational
    ? error.message
    : 'Something went wrong on our end. Please try again later.';

  res.status(statusCode).json({
    status: error.status || 'error',
    message,
    ...(isProd ? {} : { stack: err.stack }),
  });
};
