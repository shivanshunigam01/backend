const Admin = require('../models/Admin');
const TDBooking = require('../models/TDBooking');

/**
 * Auto-assign an available executive for a given branch + slot.
 * Returns an Admin doc or null (manual assignment needed).
 */
async function autoAssignExecutive(branchId, slotDate, slotTime) {
  const executives = await Admin.find({ role: 'executive', active: true });
  if (!executives.length) return null;

  const dateStr = new Date(slotDate).toISOString().split('T')[0];
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  const busyBookings = await TDBooking.find({
    slotDate: { $gte: startOfDay, $lte: endOfDay },
    slotTime,
    bookingStatus: { $nin: ['CANCELLED', 'MISSED'] },
    assignedExecutive: { $exists: true, $ne: null }
  }).select('assignedExecutive');

  const busyIds = new Set(busyBookings.map((b) => String(b.assignedExecutive)));

  const available = executives.filter((e) => !busyIds.has(String(e._id)));
  if (!available.length) return null;

  // Sort by workload (least bookings first) — basic round-robin
  const counts = await Promise.all(
    available.map((e) =>
      TDBooking.countDocuments({
        assignedExecutive: e._id,
        bookingStatus: { $nin: ['CANCELLED', 'MISSED'] }
      }).then((c) => ({ exec: e, count: c }))
    )
  );
  counts.sort((a, b) => a.count - b.count);
  return counts[0].exec;
}

module.exports = { autoAssignExecutive };
