const Admin = require('../models/Admin');
const ApiError = require('../utils/apiError');
const { verifyToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');

exports.protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Missing or invalid authorization token');
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  const admin = await Admin.findById(decoded.id).select('-password');

  if (!admin || !admin.active) {
    throw new ApiError(401, 'Admin not found or inactive');
  }

  req.admin = admin;
  next();
});

exports.authorize = (...roles) => (req, res, next) => {
  if (!req.admin || !roles.includes(req.admin.role)) {
    return next(new ApiError(403, 'You are not allowed to perform this action'));
  }
  next();
};
