const DemoVehicle = require('../models/DemoVehicle');
const VehicleStatusLog = require('../models/VehicleStatusLog');
const { sendNotification } = require('./notifications');

const BATTERY_LOW_THRESHOLD = 20;
const KM_SERVICE_THRESHOLD = 5000;
const IDLE_DAYS_THRESHOLD = 7;

/**
 * Run depletion checks after a test drive ends.
 * Handles battery alerts, service due, idle vehicle detection.
 */
async function checkDepletionAlerts(vehicleId) {
  const vehicle = await DemoVehicle.findById(vehicleId).populate('branchId', 'name');
  if (!vehicle) return;

  const alerts = [];

  // Battery low check
  if (vehicle.batteryPercent <= BATTERY_LOW_THRESHOLD && vehicle.status === 'AVAILABLE') {
    const prevStatus = vehicle.status;
    vehicle.status = 'BATTERY_LOW';
    await vehicle.save();
    await VehicleStatusLog.create({
      vehicleId,
      fromStatus: prevStatus,
      toStatus: 'BATTERY_LOW',
      reason: `Battery at ${vehicle.batteryPercent}% (threshold: ${BATTERY_LOW_THRESHOLD}%)`
    });
    await sendNotification({
      channel: 'SYSTEM',
      recipientType: 'ADMIN',
      recipientId: 'system',
      recipientContact: '',
      templateKey: 'VEHICLE_BATTERY_LOW',
      payload: { vehicleId: vehicle.vehicleId, model: vehicle.model, battery: vehicle.batteryPercent }
    });
    alerts.push('BATTERY_LOW');
  }

  // Service due check
  if (vehicle.serviceDueDate && new Date(vehicle.serviceDueDate) <= new Date() && vehicle.status === 'AVAILABLE') {
    const prevStatus = vehicle.status;
    vehicle.status = 'SERVICE_DUE';
    await vehicle.save();
    await VehicleStatusLog.create({
      vehicleId,
      fromStatus: prevStatus,
      toStatus: 'SERVICE_DUE',
      reason: 'Service date passed'
    });
    await sendNotification({
      channel: 'SYSTEM',
      recipientType: 'ADMIN',
      recipientId: 'system',
      recipientContact: '',
      templateKey: 'VEHICLE_SERVICE_DUE',
      payload: { vehicleId: vehicle.vehicleId, model: vehicle.model }
    });
    alerts.push('SERVICE_DUE');
  }

  return alerts;
}

/**
 * Check for vehicles that have been idle for too long.
 */
async function checkIdleVehicles() {
  const cutoff = new Date(Date.now() - IDLE_DAYS_THRESHOLD * 24 * 60 * 60 * 1000);
  const idleVehicles = await DemoVehicle.find({
    status: 'AVAILABLE',
    updatedAt: { $lt: cutoff }
  });

  for (const v of idleVehicles) {
    await sendNotification({
      channel: 'SYSTEM',
      recipientType: 'MANAGER',
      recipientId: 'system',
      recipientContact: '',
      templateKey: 'VEHICLE_BATTERY_LOW',
      payload: { vehicleId: v.vehicleId, model: v.model, battery: v.batteryPercent }
    });
    console.log(`[DepletionEngine] Vehicle ${v.vehicleId} idle for >${IDLE_DAYS_THRESHOLD} days`);
  }
}

module.exports = { checkDepletionAlerts, checkIdleVehicles, BATTERY_LOW_THRESHOLD };
