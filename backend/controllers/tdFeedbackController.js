const TDFeedback = require('../models/TDFeedback');
const TDBooking = require('../models/TDBooking');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getPagination, buildPaginatedResponse } = require('../utils/pagination');

exports.submitFeedback = asyncHandler(async (req, res) => {
  const { bookingId, customerId, drivingExperience, vehicleComfort, batteryConfidence, executiveBehaviour, purchaseIntention, preferredVariant, remarks } = req.body;

  const booking = await TDBooking.findById(bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found');

  const existing = await TDFeedback.findOne({ bookingId });
  if (existing) {
    return res.json({ success: true, data: existing, message: 'Feedback already submitted' });
  }

  const feedback = await TDFeedback.create({
    bookingId,
    customerId: customerId || booking.customerId,
    drivingExperience,
    vehicleComfort,
    batteryConfidence,
    executiveBehaviour,
    purchaseIntention,
    preferredVariant,
    remarks
  });

  res.status(201).json({ success: true, data: feedback, message: 'Thank you for your feedback!' });
});

exports.getFeedbacks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req);
  const query = {};
  if (req.query.bookingId) query.bookingId = req.query.bookingId;
  if (req.query.customerId) query.customerId = req.query.customerId;
  if (req.query.minRating) query.overallRating = { $gte: Number(req.query.minRating) };

  const [docs, total] = await Promise.all([
    TDFeedback.find(query)
      .populate('bookingId', 'bookingId slotDate')
      .populate('customerId', 'name mobile')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit),
    TDFeedback.countDocuments(query)
  ]);

  res.json({ success: true, ...buildPaginatedResponse({ docs, total, page, limit }) });
});

exports.getFeedbackByBooking = asyncHandler(async (req, res) => {
  const feedback = await TDFeedback.findOne({ bookingId: req.params.bookingId })
    .populate('customerId', 'name mobile');
  if (!feedback) throw new ApiError(404, 'Feedback not found for this booking');
  res.json({ success: true, data: feedback });
});

exports.getFeedbackStats = asyncHandler(async (req, res) => {
  const stats = await TDFeedback.aggregate([
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        avgDriving: { $avg: '$drivingExperience' },
        avgComfort: { $avg: '$vehicleComfort' },
        avgBattery: { $avg: '$batteryConfidence' },
        avgExecutive: { $avg: '$executiveBehaviour' },
        avgPurchase: { $avg: '$purchaseIntention' },
        avgOverall: { $avg: '$overallRating' }
      }
    }
  ]);

  const ratingDist = await TDFeedback.aggregate([
    { $group: { _id: '$overallRating', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  res.json({ success: true, data: { ...(stats[0] || {}), ratingDistribution: ratingDist } });
});
