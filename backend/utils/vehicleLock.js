const DemoVehicle = require('../models/DemoVehicle');
const VehicleStatusLog = require('../models/VehicleStatusLog');

const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Temporarily lock a vehicle during booking creation.
 * Returns false if the vehicle is already locked or unavailable.
 */
async function lockVehicle(vehicleId, adminId = null) {
  const now = new Date();
  const vehicle = await DemoVehicle.findById(vehicleId);
  if (!vehicle) return { success: false, message: 'Vehicle not found' };

  if (vehicle.status !== 'AVAILABLE') {
    return { success: false, message: `Vehicle is ${vehicle.status}` };
  }

  if (vehicle.isLocked && vehicle.lockExpiresAt && vehicle.lockExpiresAt > now) {
    return { success: false, message: 'Vehicle is temporarily locked by another booking' };
  }

  const prevStatus = vehicle.status;
  vehicle.isLocked = true;
  vehicle.lockExpiresAt = new Date(now.getTime() + LOCK_DURATION_MS);
  await vehicle.save();

  await VehicleStatusLog.create({
    vehicleId,
    fromStatus: prevStatus,
    toStatus: 'TEMP_LOCK',
    changedBy: adminId,
    reason: 'Temporary lock during booking'
  });

  return { success: true };
}

/**
 * Confirm vehicle as BOOKED (after booking is confirmed).
 */
async function confirmVehicleLock(vehicleId, bookingId, adminId = null) {
  const vehicle = await DemoVehicle.findById(vehicleId);
  if (!vehicle) return;
  const prevStatus = vehicle.status;
  vehicle.status = 'BOOKED';
  vehicle.isLocked = false;
  vehicle.lockExpiresAt = null;
  await vehicle.save();

  await VehicleStatusLog.create({
    vehicleId,
    fromStatus: prevStatus,
    toStatus: 'BOOKED',
    changedBy: adminId,
    bookingId,
    reason: 'Booking confirmed'
  });
}

/**
 * Release a vehicle lock if the booking was not completed within lock window.
 */
async function releaseLock(vehicleId, adminId = null, reason = 'Lock expired') {
  const vehicle = await DemoVehicle.findById(vehicleId);
  if (!vehicle || !vehicle.isLocked) return;
  const prevStatus = vehicle.status;
  vehicle.status = 'AVAILABLE';
  vehicle.isLocked = false;
  vehicle.lockExpiresAt = null;
  await vehicle.save();

  await VehicleStatusLog.create({
    vehicleId,
    fromStatus: prevStatus,
    toStatus: 'AVAILABLE',
    changedBy: adminId,
    reason
  });
}

/**
 * Release all stale locks (called periodically).
 */
async function releaseStaleLocks() {
  const now = new Date();
  const staleLocked = await DemoVehicle.find({ isLocked: true, lockExpiresAt: { $lt: now } });
  for (const v of staleLocked) {
    await releaseLock(v._id, null, 'Stale lock auto-released');
  }
  if (staleLocked.length > 0) {
    console.log(`[VehicleLock] Released ${staleLocked.length} stale lock(s)`);
  }
}

module.exports = { lockVehicle, confirmVehicleLock, releaseLock, releaseStaleLocks };
