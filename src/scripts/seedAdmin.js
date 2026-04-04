require('dotenv').config();
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

(async () => {
  try {
    await connectDB();
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@patliputraauto.com';
    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log(`Admin already exists for ${email}`);
      process.exit(0);
    }

    const admin = await Admin.create({
      name: process.env.SEED_ADMIN_NAME || 'Super Admin',
      email,
      password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!',
      role: 'superadmin',
      active: true,
    });

    console.log(`Seeded admin: ${admin.email}`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin:', error.message);
    process.exit(1);
  }
})();
