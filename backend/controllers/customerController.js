const Customer = require('../models/Customer');
const DrivingLicense = require('../models/DrivingLicense');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getPagination, buildPaginatedResponse } = require('../utils/pagination');

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

exports.registerCustomer = asyncHandler(async (req, res) => {
  const existing = await Customer.findOne({ mobile: req.body.mobile });
  if (existing) {
    return res.json({ success: true, data: existing, message: 'Customer already registered' });
  }
  const customer = await Customer.create(req.body);
  res.status(201).json({ success: true, data: customer });
});

exports.sendOtp = asyncHandler(async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) throw new ApiError(400, 'Mobile number is required');

  let customer = await Customer.findOne({ mobile });
  if (!customer) throw new ApiError(404, 'Customer not found. Please register first.');

  const otp = generateOtp();
  customer.otp = otp;
  customer.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await customer.save();

  // Stub: In production send via SMS/WhatsApp
  console.log(`[OTP] Customer ${customer.customerId} → OTP: ${otp}`);

  res.json({ success: true, message: 'OTP sent to your mobile number', ...(process.env.NODE_ENV !== 'production' && { otp }) });
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const { mobile, otp } = req.body;
  const customer = await Customer.findOne({ mobile }).select('+otp +otpExpiry');
  if (!customer) throw new ApiError(404, 'Customer not found');

  if (!customer.otp || customer.otp !== String(otp)) throw new ApiError(400, 'Invalid OTP');
  if (!customer.otpExpiry || new Date() > customer.otpExpiry) throw new ApiError(400, 'OTP has expired');

  customer.otp = undefined;
  customer.otpExpiry = undefined;
  await customer.save();

  res.json({ success: true, message: 'OTP verified', data: { customerId: customer._id, customerCode: customer.customerId } });
});

exports.getCustomers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req);
  const query = {};
  if (req.query.branchId) query.branchId = req.query.branchId;
  if (req.query.search) {
    const r = new RegExp(req.query.search.trim(), 'i');
    query.$or = [{ name: r }, { mobile: r }, { email: r }, { customerId: r }];
  }

  const [docs, total] = await Promise.all([
    Customer.find(query).populate('branchId', 'name code').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Customer.countDocuments(query)
  ]);

  res.json({ success: true, ...buildPaginatedResponse({ docs, total, page, limit }) });
});

exports.getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id).populate('branchId', 'name code').populate('leadId', 'name status');
  if (!customer) throw new ApiError(404, 'Customer not found');

  const dl = await DrivingLicense.findOne({ customerId: req.params.id }).sort({ createdAt: -1 });
  res.json({ success: true, data: { ...customer.toObject(), drivingLicense: dl } });
});

exports.updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!customer) throw new ApiError(404, 'Customer not found');
  res.json({ success: true, data: customer });
});

exports.uploadDL = asyncHandler(async (req, res) => {
  const { customerId, dlNumber, dlExpiry, frontImageUrl, backImageUrl } = req.body;

  const customer = await Customer.findById(customerId);
  if (!customer) throw new ApiError(404, 'Customer not found');

  const now = new Date();
  const expiry = dlExpiry ? new Date(dlExpiry) : null;

  let verificationStatus = 'VERIFIED';
  let remarks = '';

  if (expiry && expiry < now) {
    verificationStatus = 'REJECTED';
    remarks = 'DL is expired — booking blocked';
  } else if (expiry) {
    const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);
    if (daysLeft < 30) {
      verificationStatus = 'MANUAL_REVIEW';
      remarks = `DL expires in ${Math.ceil(daysLeft)} days — warning issued`;
    }
  }

  const dl = await DrivingLicense.findOneAndUpdate(
    { customerId },
    { customerId, dlNumber, dlExpiry: expiry, frontImageUrl, backImageUrl, ocrExtractedNumber: dlNumber, ocrExtractedExpiry: expiry, verificationStatus, remarks },
    { upsert: true, new: true }
  );

  const blocked = verificationStatus === 'REJECTED';
  res.json({
    success: true,
    data: dl,
    dlBlocked: blocked,
    message: blocked ? 'DL is expired. Booking is not allowed.' : verificationStatus === 'MANUAL_REVIEW' ? remarks : 'DL verified successfully'
  });
});
