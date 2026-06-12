const mongoose = require('mongoose');

const GpsPointSchema = new mongoose.Schema({
  lat: Number,
  lng: Number,
  timestamp: Date
}, { _id: false });

const TDLogSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'TDBooking', required: true },
  executiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'DemoVehicle' },
  openingOdometer: { type: Number },
  closingOdometer: { type: Number },
  totalKM: { type: Number },
  openingBattery: { type: Number, min: 0, max: 100 },
  closingBattery: { type: Number, min: 0, max: 100 },
  startTime: { type: Date },
  endTime: { type: Date },
  durationMinutes: { type: Number },
  startPhotoUrl: { type: String },
  endPhotoUrl: { type: String },
  damageNotes: { type: String, trim: true },
  executiveRemarks: { type: String, trim: true },
  customerSignatureUrl: { type: String },
  customerOtpVerified: { type: Boolean, default: false },
  gpsRoute: [GpsPointSchema],
  status: { type: String, enum: ['STARTED', 'COMPLETED', 'ABORTED'], default: 'STARTED' }
}, { timestamps: true });

TDLogSchema.pre('save', function (next) {
  if (this.closingOdometer != null && this.openingOdometer != null) {
    this.totalKM = Math.max(0, this.closingOdometer - this.openingOdometer);
  }
  if (this.endTime && this.startTime) {
    this.durationMinutes = Math.round((this.endTime - this.startTime) / 60000);
  }
  next();
});

module.exports = mongoose.model('TDLog', TDLogSchema);
