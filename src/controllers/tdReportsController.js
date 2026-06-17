const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const { buildAdminReport } = require('../utils/tdReportBuilder');

exports.getAdminReport = asyncHandler(async (req, res) => {
  const data = await buildAdminReport({
    from: req.query.from,
    to: req.query.to,
    branchId: req.query.branchId,
  });
  return successResponse(res, data);
});
