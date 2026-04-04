const Admin = require('../models/Admin');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const { signToken } = require('../utils/jwt');

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email }).select('+password');

  if (!admin || !admin.active || !(await admin.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken({ id: admin._id, role: admin.role });
  const safeAdmin = {
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };

  return res.status(200).json({ success: true, token, admin: safeAdmin });
});

exports.me = asyncHandler(async (req, res) => successResponse(res, req.admin));
