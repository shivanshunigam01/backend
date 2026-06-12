const Branch = require('../models/Branch');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getPagination, buildPaginatedResponse } = require('../utils/pagination');

exports.createBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.create(req.body);
  res.status(201).json({ success: true, data: branch });
});

exports.getBranches = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req);
  const query = {};
  if (req.query.active !== undefined) query.active = req.query.active === 'true';

  const [docs, total] = await Promise.all([
    Branch.find(query).populate('managerRef', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Branch.countDocuments(query)
  ]);

  res.json({ success: true, ...buildPaginatedResponse({ docs, total, page, limit }) });
});

exports.getBranchById = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id).populate('managerRef', 'name email');
  if (!branch) throw new ApiError(404, 'Branch not found');
  res.json({ success: true, data: branch });
});

exports.updateBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('managerRef', 'name email');
  if (!branch) throw new ApiError(404, 'Branch not found');
  res.json({ success: true, data: branch });
});

exports.deleteBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id);
  if (!branch) throw new ApiError(404, 'Branch not found');
  await branch.deleteOne();
  res.json({ success: true, message: 'Branch deleted' });
});

exports.getPublicBranches = asyncHandler(async (req, res) => {
  const docs = await Branch.find({ active: true }).select('name code city phone').sort({ name: 1 });
  res.json({ success: true, data: docs });
});
