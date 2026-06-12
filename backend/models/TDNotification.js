const mongoose = require('mongoose');

const TDNotificationSchema = new mongoose.Schema({
  recipientType: { type: String, enum: ['CUSTOMER', 'EXECUTIVE', 'MANAGER', 'ADMIN'], required: true },
  recipientId: { type: String },
  recipientContact: { type: String },
  channel: { type: String, enum: ['WHATSAPP', 'SMS', 'EMAIL', 'SYSTEM'], required: true },
  templateKey: { type: String, required: true },
  subject: { type: String },
  payload: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['PENDING', 'SENT', 'FAILED'], default: 'PENDING' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'TDBooking' },
  sentAt: { type: Date },
  errorMessage: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('TDNotification', TDNotificationSchema);
