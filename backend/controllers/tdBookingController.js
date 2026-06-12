const TDBooking = require('../models/TDBooking');
const Customer = require('../models/Customer');
const DrivingLicense = require('../models/DrivingLicense');
const DemoVehicle = require('../models/DemoVehicle');
const Lead = require('../models/Lead');
const LeadStageHistory = require('../models/LeadStageHistory');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getPagination, buildPaginatedResponse } = require('../utils/pagination');
const { lockVehicle, confirmVehicleLock } = require('../utils/vehicleLock');
const { isSlotAvailable } = require('../utils/slotEngine');
const { autoAssignExecutive } = require('../utils/executiveAssignment');
const { notifyBookingConfirmed } = require('../utils/notifications');
const TDSlotConfig = require('../models/TDSlotConfig');

exports.createBooking = asyncHandler(async (req, res) => {
  const { customerId, vehicleId, branchId, slotDate, slotTime, preferredModel } = req.body;

  const customer = await Customer.findById(customerId);
  if (!customer) throw new ApiError(404, 'Customer not found');

  // DL validation
  const dl = await DrivingLicense.findOne({ customerId }).sort({ createdAt: -1 });
  if (!dl) throw new ApiError(400, 'Customer must upload a valid Driving License before booking');
  if (dl.verificationStatus === 'REJECTED') throw new ApiError(400, 'Booking blocked: Driving License is expired or rejected');

  // Slot availability
  const config = await TDSlotConfig.findOne({ branchId, active: true });
  const maxConcurrent = config ? config.maxConcurrentBookings : 2;
  const slotOk = await isSlotAvailable(branchId, slotDate, slotTime, maxConcurrent);
  if (!slotOk) throw new ApiError(409, 'This slot is fully booked. Please choose another time.');

  // Vehicle lock (optional — customer may not have chosen a vehicle yet)
  let vehicle = null;
  if (vehicleId) {
    const lockResult = await lockVehicle(vehicleId, req.admin?._id);
    if (!lockResult.success) throw new ApiError(409, lockResult.message);
    vehicle = await DemoVehicle.findById(vehicleId);
  }

  // Auto-assign executive
  const executive = await autoAssignExecutive(branchId, slotDate, slotTime);

  const booking = await TDBooking.create({
    customerId,
    vehicleId: vehicle ? vehicle._id : undefined,
    branchId,
    assignedExecutive: executive ? executive._id : undefined,
    slotDate: new Date(slotDate),
    slotTime,
    preferredModel,
    dlVerified: dl.verificationStatus === 'VERIFIED',
    bookingStatus: 'CONFIRMED',
    confirmationSentAt: new Date()
  });

  // Confirm vehicle lock → BOOKED
  if (vehicle) {
    await confirmVehicleLock(vehicle._id, booking._id, req.admin?._id);
  }

  // CRM: Update Lead stage if leadId exists
  if (customer.leadId) {
    const lead = await Lead.findById(customer.leadId);
    if (lead) {
      const prevStage = lead.status;
      lead.status = 'Booked';
      lead.remarks = `Test Drive booked — ${booking.bookingId}`;
      await lead.save();
      await LeadStageHistory.create({
        leadId: lead._id,
        bookingId: booking._id,
        fromStage: prevStage,
        toStage: 'TEST_DRIVE_BOOKED',
        reason: `Booking ${booking.bookingId} created`
      });
    }
  }

  // Notifications (fire and forget)
  notifyBookingConfirmed(booking, customer, executive).catch(console.error);

  await booking.populate([
    { path: 'customerId', select: 'name mobile customerId' },
    { path: 'vehicleId', select: 'vehicleId model variant registrationNo' },
    { path: 'assignedExecutive', select: 'name email' },
    { path: 'branchId', select: 'name code' }
  ]);

  res.status(201).json({ success: true, data: booking, message: 'Test Drive booked successfully!' });
});

exports.getBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req);
  const query = {};
  if (req.query.branchId) query.branchId = req.query.branchId;
  if (req.query.status) query.bookingStatus = req.query.status;
  if (req.query.executiveId) query.assignedExecutive = req.query.executiveId;
  if (req.query.customerId) query.customerId = req.query.customerId;
  if (req.query.date) {
    const d = req.query.date;
    query.slotDate = { $gte: new Date(`${d}T00:00:00.000Z`), $lte: new Date(`${d}T23:59:59.999Z`) };
  }
  if (req.query.from || req.query.to) {
    query.slotDate = {};
    if (req.query.from) query.slotDate.$gte = new Date(req.query.from);
    if (req.query.to) query.slotDate.$lte = new Date(req.query.to);
  }

  const [docs, total] = await Promise.all([
    TDBooking.find(query)
      .populate('customerId', 'name mobile customerId')
      .populate('vehicleId', 'vehicleId model registrationNo color')
      .populate('assignedExecutive', 'name email')
      .populate('branchId', 'name code')
      .sort({ slotDate: -1, slotTime: -1 })
      .skip(skip).limit(limit),
    TDBooking.countDocuments(query)
  ]);

  res.json({ success: true, ...buildPaginatedResponse({ docs, total, page, limit }) });
});

exports.getBookingById = asyncHandler(async (req, res) => {
  const booking = await TDBooking.findById(req.params.id)
    .populate('customerId', 'name mobile email customerId city')
    .populate('vehicleId', 'vehicleId model variant registrationNo batteryPercent color')
    .populate('assignedExecutive', 'name email')
    .populate('branchId', 'name code address');
  if (!booking) throw new ApiError(404, 'Booking not found');
  res.json({ success: true, data: booking });
});

exports.updateBooking = asyncHandler(async (req, res) => {
  const booking = await TDBooking.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('customerId', 'name mobile')
    .populate('assignedExecutive', 'name email')
    .populate('branchId', 'name code');
  if (!booking) throw new ApiError(404, 'Booking not found');
  res.json({ success: true, data: booking });
});

exports.cancelBooking = asyncHandler(async (req, res) => {
  const booking = await TDBooking.findById(req.params.id).populate('vehicleId');
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (['COMPLETED', 'CANCELLED'].includes(booking.bookingStatus)) {
    throw new ApiError(400, `Cannot cancel a booking that is ${booking.bookingStatus}`);
  }

  booking.bookingStatus = 'CANCELLED';
  booking.cancellationReason = req.body.reason || '';
  await booking.save();

  // Release vehicle if booked
  if (booking.vehicleId && booking.vehicleId.status === 'BOOKED') {
    booking.vehicleId.status = 'AVAILABLE';
    await booking.vehicleId.save();
  }

  res.json({ success: true, message: 'Booking cancelled', data: booking });
});

exports.rescheduleBooking = asyncHandler(async (req, res) => {
  const { slotDate, slotTime } = req.body;
  const booking = await TDBooking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.bookingStatus === 'COMPLETED') throw new ApiError(400, 'Cannot reschedule a completed booking');

  const slotOk = await isSlotAvailable(booking.branchId, slotDate, slotTime, 2, booking._id);
  if (!slotOk) throw new ApiError(409, 'New slot is not available. Please choose another time.');

  booking.slotDate = new Date(slotDate);
  booking.slotTime = slotTime;
  booking.bookingStatus = 'RESCHEDULED';
  booking.rescheduleCount += 1;
  await booking.save();

  res.json({ success: true, data: booking, message: 'Booking rescheduled successfully' });
});

exports.assignExecutive = asyncHandler(async (req, res) => {
  const { executiveId } = req.body;
  const booking = await TDBooking.findByIdAndUpdate(
    req.params.id,
    { assignedExecutive: executiveId },
    { new: true }
  ).populate('assignedExecutive', 'name email');
  if (!booking) throw new ApiError(404, 'Booking not found');
  res.json({ success: true, data: booking, message: 'Executive assigned' });
});

exports.getMyBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req);
  const query = { assignedExecutive: req.admin._id };
  if (req.query.status) query.bookingStatus = req.query.status;

  const [docs, total] = await Promise.all([
    TDBooking.find(query)
      .populate('customerId', 'name mobile customerId')
      .populate('vehicleId', 'vehicleId model registrationNo')
      .populate('branchId', 'name')
      .sort({ slotDate: 1 })
      .skip(skip).limit(limit),
    TDBooking.countDocuments(query)
  ]);

  res.json({ success: true, ...buildPaginatedResponse({ docs, total, page, limit }) });
});
