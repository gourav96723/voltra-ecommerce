const AppError = require('../utils/AppError');

// Wraps a Zod schema; validates req.body (default) or another part of the request.
module.exports = function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      return next(new AppError(`Validation failed - ${message}`, 422));
    }
    req[source] = result.data;
    next();
  };
};
