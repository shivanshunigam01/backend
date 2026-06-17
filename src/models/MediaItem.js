const mongoose = require('mongoose');
const { resourceTypes } = require('../constants/enums');

const mediaItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
    tag: { type: String, trim: true },
    resourceType: { type: String, enum: resourceTypes, default: 'image' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MediaItem', mediaItemSchema);
