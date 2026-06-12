const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  customerId: { type: String, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  pinCode: { type: String, trim: true },
  preferredVehicle: { type: String, enum: ['VF 6', 'VF 7', 'Both', ''], default: '' },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  otp: { type: String, select: false },
  otpExpiry: { type: Date, select: false },
  active: { type: Boolean, default: true }
}, { timestamps: true });

CustomerSchema.pre('save', async function (next) {
  if (this.customerId) return next();
  try {
    const Branch = mongoose.model('Branch');
    const branch = this.branchId ? await Branch.findById(this.branchId) : null;
    const branchCode = branch ? branch.code : 'GEN';
    const year = new Date().getFullYear();
    const count = await mongoose.model('Customer').countDocuments({
      customerId: new RegExp(`^VIN-TD-${branchCode}-${year}-`)
    });
    const runNo = String(count + 1).padStart(6, '0');
    this.customerId = `VIN-TD-${branchCode}-${year}-${runNo}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Customer', CustomerSchema);
