const Lead = require('../models/Lead');
const TestDrive = require('../models/TestDrive');
const Enquiry = require('../models/Enquiry');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');

exports.getStats = asyncHandler(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalLeads,
    leadsToday,
    pendingTestDrives,
    openEnquiries,
    leadsByStatus,
    leadsBySource,
    leadsByModel,
  ] = await Promise.all([
    Lead.countDocuments(),
    Lead.countDocuments({ createdAt: { $gte: startOfDay } }),
    TestDrive.countDocuments({ status: { $in: ['Pending', 'Scheduled'] } }),
    Enquiry.countDocuments({ status: { $in: ['Open', 'In Progress'] } }),
    Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Lead.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),
    Lead.aggregate([{ $group: { _id: '$model', count: { $sum: 1 } } }]),
  ]);

  return successResponse(res, {
    totalLeads,
    leadsToday,
    pendingTestDrives,
    openEnquiries,
    leadsByStatus,
    leadsBySource,
    leadsByModel,
  });
});
