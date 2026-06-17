const Lead = require('../models/Lead');
const TestDrive = require('../models/TestDrive');
const Enquiry = require('../models/Enquiry');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const { syncTestDriveToTdBooking } = require('../utils/tdBookingSync');

const MSG_LEAD_OK =
  'Thank you! Our EV advisor will contact you within 10 minutes.';
const MSG_TD_OK = 'Test drive request submitted successfully.';
const MSG_ENQ_OK = 'Your enquiry has been submitted successfully.';

exports.createLead = asyncHandler(async (req, res) => {
  const lead = await Lead.create(req.body);
  return successResponse(res, lead, MSG_LEAD_OK, 201);
});

exports.createTestDrive = asyncHandler(async (req, res) => {
  const testDrive = await TestDrive.create(req.body);
  await syncTestDriveToTdBooking(testDrive);
  return successResponse(res, testDrive, MSG_TD_OK, 201);
});

exports.createEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.create(req.body);
  return successResponse(res, enquiry, MSG_ENQ_OK, 201);
});
