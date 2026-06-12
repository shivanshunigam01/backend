const TDBooking = require('../models/TDBooking');

/**
 * Convert "HH:MM" time string to minutes since midnight.
 */
function toMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convert minutes since midnight to "HH:MM" string.
 */
function toTimeStr(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Generate all available time slots for a branch on a given date.
 * @param {string} branchId
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {object} config - { slotDuration, bufferTime, workingStartTime, workingEndTime, maxConcurrentBookings }
 * @returns {Array<{ time: string, available: boolean, bookings: number }>}
 */
async function getAvailableSlots(branchId, dateStr, config) {
  const {
    slotDuration = 60,
    bufferTime = 15,
    workingStartTime = '09:00',
    workingEndTime = '18:00',
    maxConcurrentBookings = 2
  } = config;

  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  const existingBookings = await TDBooking.find({
    branchId,
    slotDate: { $gte: startOfDay, $lte: endOfDay },
    bookingStatus: { $nin: ['CANCELLED', 'MISSED'] }
  }).select('slotTime slotDuration');

  const slotOccupancy = {};
  for (const b of existingBookings) {
    const key = b.slotTime;
    slotOccupancy[key] = (slotOccupancy[key] || 0) + 1;
  }

  const slots = [];
  let current = toMinutes(workingStartTime);
  const end = toMinutes(workingEndTime);

  while (current + slotDuration <= end) {
    const timeKey = toTimeStr(current);
    const booked = slotOccupancy[timeKey] || 0;
    slots.push({
      time: timeKey,
      available: booked < maxConcurrentBookings,
      bookings: booked,
      maxBookings: maxConcurrentBookings
    });
    current += slotDuration + bufferTime;
  }

  return slots;
}

/**
 * Check if a specific slot is available (not fully booked and not in the past).
 */
async function isSlotAvailable(branchId, slotDate, slotTime, maxConcurrentBookings = 2, excludeBookingId = null) {
  const dateStr = new Date(slotDate).toISOString().split('T')[0];
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  const query = {
    branchId,
    slotDate: { $gte: startOfDay, $lte: endOfDay },
    slotTime,
    bookingStatus: { $nin: ['CANCELLED', 'MISSED'] }
  };

  if (excludeBookingId) query._id = { $ne: excludeBookingId };

  const count = await TDBooking.countDocuments(query);
  return count < maxConcurrentBookings;
}

module.exports = { getAvailableSlots, isSlotAvailable, toMinutes, toTimeStr };
