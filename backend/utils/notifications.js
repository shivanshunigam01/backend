const TDNotification = require('../models/TDNotification');

const TEMPLATES = {
  BOOKING_CONFIRMED: (data) => `Hi ${data.customerName}, your VinFast Test Drive is confirmed on ${data.date} at ${data.time}. Booking ID: ${data.bookingId}. Our executive will contact you shortly.`,
  EXECUTIVE_ASSIGNED: (data) => `Hi ${data.executiveName}, you have a new test drive assignment. Customer: ${data.customerName}, Date: ${data.date} at ${data.time}. Booking: ${data.bookingId}.`,
  TD_REMINDER: (data) => `Reminder: Your VinFast Test Drive is tomorrow (${data.date}) at ${data.time}. Booking ID: ${data.bookingId}.`,
  TD_COMPLETED: (data) => `Thank you ${data.customerName}! Your VinFast test drive is complete. We'd love your feedback. Reply FEEDBACK to rate your experience.`,
  FEEDBACK_REQUEST: (data) => `Hi ${data.customerName}, please share your VinFast test drive feedback. Booking: ${data.bookingId}.`,
  BOOKING_CANCELLED: (data) => `Hi ${data.customerName}, your test drive booking ${data.bookingId} has been cancelled. ${data.reason ? `Reason: ${data.reason}` : ''} Contact us to rebook.`,
  MISSED_BOOKING: (data) => `Alert: Customer ${data.customerName} missed their test drive on ${data.date} at ${data.time}. Booking: ${data.bookingId}.`,
  VEHICLE_BATTERY_LOW: (data) => `Alert: Vehicle ${data.vehicleId} (${data.model}) battery is at ${data.battery}%. Please arrange charging immediately.`,
  VEHICLE_SERVICE_DUE: (data) => `Alert: Vehicle ${data.vehicleId} (${data.model}) is due for service. Please schedule maintenance.`,
};

/**
 * Send a notification (stub — logs to console and saves to DB).
 * In production, replace stub body with real WhatsApp/SMS/Email API calls.
 */
async function sendNotification({ channel, recipientType, recipientId, recipientContact, templateKey, payload, bookingId }) {
  const messageBuilder = TEMPLATES[templateKey];
  const message = messageBuilder ? messageBuilder(payload || {}) : templateKey;

  const notif = await TDNotification.create({
    recipientType,
    recipientId: String(recipientId || ''),
    recipientContact,
    channel,
    templateKey,
    subject: templateKey.replace(/_/g, ' '),
    payload,
    bookingId,
    status: 'SENT',
    sentAt: new Date()
  });

  // Stub: log to console. Replace with real API calls below.
  console.log(`[Notification][${channel}] → ${recipientContact} | ${templateKey}: ${message}`);

  return notif;
}

/**
 * Send booking confirmed notification to customer + executive.
 */
async function notifyBookingConfirmed(booking, customer, executive) {
  const date = new Date(booking.slotDate).toLocaleDateString('en-IN');

  await sendNotification({
    channel: 'SMS',
    recipientType: 'CUSTOMER',
    recipientId: customer._id,
    recipientContact: customer.mobile,
    templateKey: 'BOOKING_CONFIRMED',
    payload: { customerName: customer.name, date, time: booking.slotTime, bookingId: booking.bookingId },
    bookingId: booking._id
  });

  if (executive) {
    await sendNotification({
      channel: 'SMS',
      recipientType: 'EXECUTIVE',
      recipientId: executive._id,
      recipientContact: executive.mobile || '',
      templateKey: 'EXECUTIVE_ASSIGNED',
      payload: { executiveName: executive.name, customerName: customer.name, date, time: booking.slotTime, bookingId: booking.bookingId },
      bookingId: booking._id
    });
  }
}

/**
 * Send test drive completed + feedback request notifications.
 */
async function notifyTDCompleted(booking, customer) {
  await sendNotification({
    channel: 'SMS',
    recipientType: 'CUSTOMER',
    recipientId: customer._id,
    recipientContact: customer.mobile,
    templateKey: 'TD_COMPLETED',
    payload: { customerName: customer.name },
    bookingId: booking._id
  });

  await sendNotification({
    channel: 'WHATSAPP',
    recipientType: 'CUSTOMER',
    recipientId: customer._id,
    recipientContact: customer.mobile,
    templateKey: 'FEEDBACK_REQUEST',
    payload: { customerName: customer.name, bookingId: booking.bookingId },
    bookingId: booking._id
  });
}

module.exports = { sendNotification, notifyBookingConfirmed, notifyTDCompleted, TEMPLATES };
