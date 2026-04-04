const mongoose = require('mongoose');
const { enquiryStatuses, enquiryInterests, productModels } = require('../constants/enums');

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    city: { type: String, trim: true },
    model: { type: String, enum: productModels.filter((v) => v !== 'Both') },
    interest: { type: String, enum: enquiryInterests, default: 'General Enquiry' },
    message: { type: String, trim: true },
    source: { type: String, trim: true, default: 'Contact Form' },
    status: { type: String, enum: enquiryStatuses, default: 'Open' },
    utmSource: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Enquiry', enquirySchema);
