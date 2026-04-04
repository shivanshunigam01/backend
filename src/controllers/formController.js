const Lead = require('../models/Lead');
const TestDrive = require('../models/TestDrive');
const Enquiry = require('../models/Enquiry');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');

exports.createLead = asyncHandler(async (req, res) => {
  const lead = await Lead.create(req.body);
  return successResponse(
    res,
    lead,
    'Thank you! Our EV advisor will contact you within 10 minutes.',
    201
  );
});

exports.createTestDrive = asyncHandler(async (req, res) => {
  const testDrive = await TestDrive.create(req.body);
  return successResponse(res, testDrive, 'Test drive request submitted successfully.', 201);
});

exports.createEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.create(req.body);
  return successResponse(res, enquiry, 'Your enquiry has been submitted successfully.', 201);
});
