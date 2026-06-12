const mongoose = require('mongoose');

const TDSlotConfigSchema = new mongoose.Schema({
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  slotDuration: { type: Number, enum: [30, 45, 60], default: 60 },
  bufferTime: { type: Number, default: 15 },
  workingStartTime: { type: String, default: '09:00' },
  workingEndTime: { type: String, default: '18:00' },
  maxConcurrentBookings: { type: Number, default: 2 },
  autoExpiry: { type: Boolean, default: true },
  blockedDates: [{ type: String }],
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('TDSlotConfig', TDSlotConfigSchema);
