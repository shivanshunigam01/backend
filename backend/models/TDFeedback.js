const mongoose = require('mongoose');

const TDFeedbackSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'TDBooking', required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  drivingExperience: { type: Number, min: 1, max: 5 },
  vehicleComfort: { type: Number, min: 1, max: 5 },
  batteryConfidence: { type: Number, min: 1, max: 5 },
  executiveBehaviour: { type: Number, min: 1, max: 5 },
  purchaseIntention: { type: Number, min: 1, max: 5 },
  preferredVariant: { type: String, trim: true },
  remarks: { type: String, trim: true },
  overallRating: { type: Number, min: 1, max: 5 }
}, { timestamps: true });

TDFeedbackSchema.pre('save', function (next) {
  const ratings = [
    this.drivingExperience,
    this.vehicleComfort,
    this.batteryConfidence,
    this.executiveBehaviour,
    this.purchaseIntention
  ].filter(Boolean);
  if (ratings.length) {
    this.overallRating = Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
  }
  next();
});

module.exports = mongoose.model('TDFeedback', TDFeedbackSchema);
