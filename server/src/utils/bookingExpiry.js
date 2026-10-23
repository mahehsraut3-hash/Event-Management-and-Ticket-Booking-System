const { Booking, Event } = require('../models');

/**
 * Check if a single booking is expired and release its inventory if so.
 * @param {Object} booking 
 * @returns {Promise<boolean>} True if expired
 */
const checkAndExpireSingleBooking = async (booking) => {
  if (!booking || booking.paymentStatus !== 'pending' || booking.bookingStatus !== 'confirmed') {
    return booking?.bookingStatus === 'expired';
  }

  const expirationMinutes = parseInt(process.env.BOOKING_EXPIRATION_MINUTES, 10) || 15;
  const expiryTime = booking.expiresAt 
    ? new Date(booking.expiresAt).getTime() 
    : new Date(booking.createdAt).getTime() + expirationMinutes * 60 * 1000;

  if (Date.now() > expiryTime) {
    console.log(`[BookingExpiry] Booking ${booking._id} expired. Releasing held inventory...`);

    // Restore event inventory
    if (booking.event && Array.isArray(booking.tickets)) {
      const eventId = booking.event._id || booking.event;
      const event = await Event.findById(eventId);

      if (event && event.ticketTypes) {
        for (const item of booking.tickets) {
          const tierIndex = event.ticketTypes.findIndex(
            (t) => t.name.toLowerCase() === (item.ticketTypeName || '').toLowerCase()
          );

          if (tierIndex !== -1) {
            await Event.findByIdAndUpdate(eventId, {
              $inc: { [`ticketTypes.${tierIndex}.soldQuantity`]: -item.quantity }
            });
            console.log(`[BookingExpiry] Restored ${item.quantity} tickets to ${item.ticketTypeName}`);
          }
        }
      }
    }

    // Update booking state
    await Booking.findByIdAndUpdate(booking._id, {
      $set: {
        bookingStatus: 'expired',
        paymentStatus: 'failed'
      }
    });

    return true;
  }

  return false;
};

/**
 * Scan all pending bookings and release inventory for those past expiration window.
 * @returns {Promise<{ expiredCount: number }>}
 */
const expireStaleBookings = async () => {
  try {
    const expirationMinutes = parseInt(process.env.BOOKING_EXPIRATION_MINUTES, 10) || 15;
    const cutoffTime = new Date(Date.now() - expirationMinutes * 60 * 1000);

    // Find pending bookings created before cutoffTime
    const staleBookings = await Booking.find({
      paymentStatus: 'pending',
      bookingStatus: 'confirmed'
    });

    let expiredCount = 0;

    for (const booking of staleBookings) {
      const expiryTime = booking.expiresAt 
        ? new Date(booking.expiresAt).getTime() 
        : new Date(booking.createdAt).getTime() + expirationMinutes * 60 * 1000;

      if (Date.now() > expiryTime) {
        await checkAndExpireSingleBooking(booking);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`[BookingExpiry] Cleared ${expiredCount} expired pending bookings and restored inventory.`);
    }

    return { expiredCount };
  } catch (error) {
    console.error('[BookingExpiry Error in expireStaleBookings]:', error);
    return { expiredCount: 0, error: error.message };
  }
};

/**
 * Start periodic worker to auto-expire pending reservations
 * @param {number} intervalMs (Default: 30 seconds)
 */
let expiryIntervalTimer = null;
const startBookingExpiryJob = (intervalMs = 30000) => {
  if (expiryIntervalTimer) {
    clearInterval(expiryIntervalTimer);
  }

  // Initial pass after 2 seconds
  setTimeout(() => {
    expireStaleBookings();
  }, 2000);

  expiryIntervalTimer = setInterval(() => {
    expireStaleBookings();
  }, intervalMs);

  console.log(`[BookingExpiry] Background auto-expiry worker started (interval: ${intervalMs / 1000}s, TTL: ${process.env.BOOKING_EXPIRATION_MINUTES || 15}m)`);
};

const stopBookingExpiryJob = () => {
  if (expiryIntervalTimer) {
    clearInterval(expiryIntervalTimer);
    expiryIntervalTimer = null;
  }
};

module.exports = {
  checkAndExpireSingleBooking,
  expireStaleBookings,
  startBookingExpiryJob,
  stopBookingExpiryJob
};
