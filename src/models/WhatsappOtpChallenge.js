const mongoose = require('mongoose');

/**
 * One document per 10-digit mobile.
 * - After send: `codeHash` + `otpSentAt` (OTP never stored in plain text).
 * - After correct code: `codeHash` cleared, `verifiedAt` set; row kept until `expiresAt` (JWT window) for audit; TTL then removes it.
 */
const whatsappOtpChallengeSchema = new mongoose.Schema(
  {
    mobile: { type: String, required: true, unique: true, trim: true, index: true },
    codeHash: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    otpSentAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    verifyAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

whatsappOtpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('WhatsappOtpChallenge', whatsappOtpChallengeSchema);
