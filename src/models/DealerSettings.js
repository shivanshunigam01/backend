const mongoose = require('mongoose');

const dealerSettingsSchema = new mongoose.Schema(
  {
    dealerName: { type: String, trim: true },
    brand: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    whatsapp: { type: String, trim: true },
    address: { type: String, trim: true },
    gstNo: { type: String, trim: true },
    showroomHours: { type: String, trim: true },
    mapEmbedUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DealerSettings', dealerSettingsSchema);
