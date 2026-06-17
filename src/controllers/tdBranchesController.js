require('../models/tdModels');

const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const { ensureTdBranch } = require('../utils/tdBootstrap');

exports.listPublicBranches = asyncHandler(async (req, res) => {
  const branch = await ensureTdBranch();
  const docs = await require('../models/TDBranch').find({ active: { $ne: false } }).sort({ name: 1 });
  const list = docs.length > 0 ? docs : [branch];
  const data = list.map((b) => ({
    _id: b._id,
    name: b.name,
    code: b.code,
    city: b.city,
    phone: b.phone,
  }));
  return successResponse(res, data);
});
