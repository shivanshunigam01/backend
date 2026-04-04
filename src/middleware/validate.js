const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  throw new ApiError(
    400,
    'Validation failed',
    result.array().map((item) => ({ field: item.path, message: item.msg }))
  );
};
