const TDSlotConfig = require('../models/TDSlotConfig');
const Branch = require('../models/Branch');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getAvailableSlots } = require('../utils/slotEngine');

exports.getSlotConfig = asyncHandler(async (req, res) => {
  const { branchId } = req.query;
  if (!branchId) throw new ApiError(400, 'branchId is required');
  const config = await TDSlotConfig.findOne({ branchId, active: true }).populate('branchId', 'name code');
  if (!config) throw new ApiError(404, 'Slot configuration not found for this branch');
  res.json({ success: true, data: config });
});

exports.getAllConfigs = asyncHandler(async (req, res) => {
  const configs = await TDSlotConfig.find({ active: true }).populate('branchId', 'name code');
  res.json({ success: true, data: configs });
});

exports.upsertSlotConfig = asyncHandler(async (req, res) => {
  const { branchId } = req.body;
  if (!branchId) throw new ApiError(400, 'branchId is required');

  const branch = await Branch.findById(branchId);
  if (!branch) throw new ApiError(404, 'Branch not found');

  const config = await TDSlotConfig.findOneAndUpdate(
    { branchId },
    req.body,
    { upsert: true, new: true, runValidators: true }
  ).populate('branchId', 'name code');

  res.json({ success: true, data: config });
});

exports.getAvailableSlotsForDate = asyncHandler(async (req, res) => {
  const { branchId, date } = req.query;
  if (!branchId || !date) throw new ApiError(400, 'branchId and date are required');

  const config = await TDSlotConfig.findOne({ branchId, active: true });
  if (!config) throw new ApiError(404, 'No slot configuration found for this branch');

  const dateStr = new Date(date).toISOString().split('T')[0];
  const isBlocked = config.blockedDates.includes(dateStr);
  if (isBlocked) {
    return res.json({ success: true, data: [], message: 'This date is blocked for bookings' });
  }

  const slots = await getAvailableSlots(branchId, dateStr, {
    slotDuration: config.slotDuration,
    bufferTime: config.bufferTime,
    workingStartTime: config.workingStartTime,
    workingEndTime: config.workingEndTime,
    maxConcurrentBookings: config.maxConcurrentBookings
  });

  res.json({ success: true, data: slots, slotDuration: config.slotDuration });
});

exports.blockDate = asyncHandler(async (req, res) => {
  const { branchId, date } = req.body;
  if (!branchId || !date) throw new ApiError(400, 'branchId and date are required');

  const config = await TDSlotConfig.findOne({ branchId });
  if (!config) throw new ApiError(404, 'Slot configuration not found');

  const dateStr = new Date(date).toISOString().split('T')[0];
  if (!config.blockedDates.includes(dateStr)) {
    config.blockedDates.push(dateStr);
    await config.save();
  }

  res.json({ success: true, message: `Date ${dateStr} blocked`, data: config });
});

exports.unblockDate = asyncHandler(async (req, res) => {
  const { branchId, date } = req.body;
  const config = await TDSlotConfig.findOne({ branchId });
  if (!config) throw new ApiError(404, 'Slot configuration not found');

  const dateStr = new Date(date).toISOString().split('T')[0];
  config.blockedDates = config.blockedDates.filter((d) => d !== dateStr);
  await config.save();

  res.json({ success: true, message: `Date ${dateStr} unblocked`, data: config });
});
