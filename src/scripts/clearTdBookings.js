/**
 * Delete all TD bookings and related feedback records.
 *
 * Usage (on server):
 *   node src/scripts/clearTdBookings.js
 *
 * Optional: set CLEAR_TD_BOOKINGS_CONFIRM=yes in .env or env to skip prompt guard.
 */
require('dotenv').config();
const connectDB = require('../config/db');
require('../models/tdModels');
const TDBooking = require('../models/TDBooking');
const TDFeedback = require('../models/TDFeedback');

(async () => {
  try {
    if (process.env.CLEAR_TD_BOOKINGS_CONFIRM !== 'yes') {
      console.error(
        'Refusing to run: set CLEAR_TD_BOOKINGS_CONFIRM=yes in environment to delete all TD bookings.',
      );
      process.exit(1);
    }

    await connectDB();

    const [bookingCount, feedbackCount] = await Promise.all([
      TDBooking.countDocuments(),
      TDFeedback.countDocuments(),
    ]);

    const feedbackResult = await TDFeedback.deleteMany({});
    const bookingResult = await TDBooking.deleteMany({});

    console.log(`Deleted ${feedbackResult.deletedCount} TD feedback record(s) (had ${feedbackCount}).`);
    console.log(`Deleted ${bookingResult.deletedCount} TD booking(s) (had ${bookingCount}).`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to clear TD bookings:', error.message);
    process.exit(1);
  }
})();
