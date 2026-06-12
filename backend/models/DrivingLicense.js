const mongoose = require('mongoose');

const DrivingLicenseSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  dlNumber: { type: String, trim: true, uppercase: true },
  dlExpiry: { type: Date },
  frontImageUrl: { type: String },
  backImageUrl: { type: String },
  ocrExtractedNumber: { type: String, trim: true },
  ocrExtractedExpiry: { type: Date },
  verificationStatus: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED', 'MANUAL_REVIEW'],
    default: 'PENDING'
  },
  nameMatchStatus: { type: String, enum: ['MATCHED', 'MISMATCH', 'UNCHECKED'], default: 'UNCHECKED' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  remarks: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('DrivingLicense', DrivingLicenseSchema);
